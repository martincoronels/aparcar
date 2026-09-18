import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const { getMock, postMock, toastSuccessMock, toastErrorMock } = vi.hoisted(() => ({
  getMock: vi.fn(),
  postMock: vi.fn(),
  toastSuccessMock: vi.fn(),
  toastErrorMock: vi.fn(),
}));

vi.mock("@/app/api", () => ({ default: { get: getMock, post: postMock } }));
vi.mock("sonner", () => ({ toast: { success: toastSuccessMock, error: toastErrorMock } }));

const { default: ReservasContent } = await import("@/components/ReservasContent");

const visitante = (overrides = {}) => ({ id: "v1", nombre: "Juan Perez", documento: "1", ...overrides });
const vehiculo = (overrides = {}) => ({ id: "veh1", patente: "ABC123", tipo: "AUTO", visitanteId: "v1", ...overrides });
const cochera = (overrides = {}) => ({ id: "c1", numero: "A-01", sector: "Planta Baja", tipo: "AUTO", ...overrides });

function mockData({ visitantes = [], vehiculos = [], reservas = [], disponibles = [] }) {
  getMock.mockImplementation((url) => {
    if (url === "/api/v1/visitantes") return Promise.resolve({ data: visitantes });
    if (url === "/api/v1/vehiculos") return Promise.resolve({ data: vehiculos });
    if (url === "/api/v1/reservas") return Promise.resolve({ data: reservas });
    if (url === "/api/v1/cocheras/disponibles") return Promise.resolve({ data: disponibles });
    return Promise.reject(new Error(`URL no mockeada: ${url}`));
  });
}

describe("ReservasContent en modo admin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("muestra el mensaje de vacio cuando no hay reservas cargadas", async () => {
    mockData({});
    render(<ReservasContent modo="admin" />);

    expect(await screen.findByText("Todavía no hay reservas cargadas.")).toBeInTheDocument();
  });

  it("lista las reservas existentes con su estado", async () => {
    mockData({
      reservas: [
        {
          id: "r1",
          fecha: "2026-01-01",
          estado: "CONFIRMADA",
          visitante: { nombre: "Juan Perez" },
          vehiculo: { patente: "ABC123" },
          cochera: { numero: "A-01", sector: "Planta Baja" },
        },
      ],
    });
    render(<ReservasContent modo="admin" />);

    expect(await screen.findByText("Juan Perez — ABC123")).toBeInTheDocument();
    expect(screen.getByText("CONFIRMADA")).toBeInTheDocument();
  });

  it("al escribir una patente registrada, muestra el nombre del visitante y el tipo de vehiculo", async () => {
    mockData({ visitantes: [visitante()], vehiculos: [vehiculo()] });
    const user = userEvent.setup();
    render(<ReservasContent modo="admin" />);
    await waitFor(() => expect(getMock).toHaveBeenCalledWith("/api/v1/vehiculos"));

    await user.type(screen.getByPlaceholderText("ABC123 / AB123CD"), "ABC123");

    expect(await screen.findByText("Juan Perez — AUTO")).toBeInTheDocument();
  });

  it("al escribir una patente que no existe, avisa que no se encontro ningun vehiculo", async () => {
    mockData({});
    const user = userEvent.setup();
    render(<ReservasContent modo="admin" />);
    await waitFor(() => expect(getMock).toHaveBeenCalledWith("/api/v1/vehiculos"));

    await user.type(screen.getByPlaceholderText("ABC123 / AB123CD"), "ZZZ999");

    expect(
      await screen.findByText("No hay ningún vehículo registrado con esa patente.")
    ).toBeInTheDocument();
  });

  it("la cochera queda deshabilitada hasta encontrar un vehiculo por patente", async () => {
    mockData({});
    render(<ReservasContent modo="admin" />);
    await waitFor(() => expect(getMock).toHaveBeenCalledWith("/api/v1/vehiculos"));

    expect(screen.getByLabelText("Cochera")).toBeDisabled();
  });

  it("al resolver un vehiculo (con fecha ya cargada por defecto), pide las cocheras disponibles de ese tipo", async () => {
    mockData({ visitantes: [visitante()], vehiculos: [vehiculo()], disponibles: [cochera()] });
    const user = userEvent.setup();
    render(<ReservasContent modo="admin" />);
    await waitFor(() => expect(getMock).toHaveBeenCalledWith("/api/v1/vehiculos"));

    await user.type(screen.getByPlaceholderText("ABC123 / AB123CD"), "ABC123");

    await waitFor(() =>
      expect(getMock).toHaveBeenCalledWith(
        "/api/v1/cocheras/disponibles",
        expect.objectContaining({ params: expect.objectContaining({ tipoVehiculo: "AUTO" }) })
      )
    );
    expect(await screen.findByRole("option", { name: /A-01/ })).toBeInTheDocument();
    expect(screen.getByLabelText("Cochera")).not.toBeDisabled();
  });

  // Regresion del bug real: si se carga un vehiculo nuevo arriba en la misma
  // pagina, esta lista ya se habia pedido antes de que existiera. El fix fue
  // re-pedirla al hacer foco en el campo de patente.
  it("el foco en el campo de patente vuelve a pedir vehiculos y visitantes", async () => {
    mockData({});
    const user = userEvent.setup();
    render(<ReservasContent modo="admin" />);
    await waitFor(() => expect(getMock).toHaveBeenCalledWith("/api/v1/vehiculos"));

    const llamadasIniciales = getMock.mock.calls.filter((c) => c[0] === "/api/v1/vehiculos").length;

    await user.click(screen.getByPlaceholderText("ABC123 / AB123CD"));

    await waitFor(() => {
      const llamadasLuegoDelFoco = getMock.mock.calls.filter((c) => c[0] === "/api/v1/vehiculos").length;
      expect(llamadasLuegoDelFoco).toBeGreaterThan(llamadasIniciales);
    });
  });

  it("confirmar la reserva envia el visitanteId/vehiculoId resueltos por patente, junto con cochera y fecha", async () => {
    mockData({ visitantes: [visitante()], vehiculos: [vehiculo()], disponibles: [cochera()] });
    postMock.mockResolvedValue({ data: {} });
    const user = userEvent.setup();
    render(<ReservasContent modo="admin" />);
    await waitFor(() => expect(getMock).toHaveBeenCalledWith("/api/v1/vehiculos"));

    await user.type(screen.getByPlaceholderText("ABC123 / AB123CD"), "ABC123");
    await screen.findByRole("option", { name: /A-01/ });
    await user.selectOptions(screen.getByLabelText("Cochera"), "c1");
    await user.click(screen.getByRole("button", { name: /confirmar reserva/i }));

    await waitFor(() =>
      expect(postMock).toHaveBeenCalledWith(
        "/api/v1/reservas",
        expect.objectContaining({ visitanteId: "v1", vehiculoId: "veh1", cocheraId: "c1" })
      )
    );
    expect(toastSuccessMock).toHaveBeenCalledWith("Reserva creada correctamente");
  });

  it("el boton de confirmar reserva esta deshabilitado hasta elegir una cochera", async () => {
    mockData({});
    render(<ReservasContent modo="admin" />);
    await waitFor(() => expect(getMock).toHaveBeenCalledWith("/api/v1/vehiculos"));

    expect(screen.getByRole("button", { name: /confirmar reserva/i })).toBeDisabled();
  });
});

describe("ReservasContent en modo visitante", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Un visitante solo puede reservar a su nombre, asi que no tiene por que
  // saber que otros visitantes existen: la pantalla ni siquiera pide la lista.
  it("no pide el catalogo de visitantes", async () => {
    mockData({ vehiculos: [vehiculo()] });
    render(<ReservasContent modo="user" />);

    await waitFor(() => expect(getMock).toHaveBeenCalledWith("/api/v1/vehiculos"));
    expect(getMock).not.toHaveBeenCalledWith("/api/v1/visitantes");
  });

  it("ofrece sus propias patentes en un desplegable en vez de un campo libre", async () => {
    mockData({ vehiculos: [vehiculo()] });
    render(<ReservasContent modo="user" />);

    expect(await screen.findByRole("option", { name: /ABC123 — AUTO/ })).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("ABC123 / AB123CD")).not.toBeInTheDocument();
  });

  it("si todavia no cargo ningun vehiculo, explica que hace falta uno para reservar", async () => {
    mockData({ vehiculos: [] });
    render(<ReservasContent modo="user" />);

    expect(
      await screen.findByText(/Cargá al menos un vehículo en "Mis datos"/)
    ).toBeInTheDocument();
  });

  // El backend ignora el visitanteId que mande un USER, pero el frontend
  // tampoco lo manda: la reserva siempre va a nombre de quien esta logueado.
  it("no manda visitanteId al reservar", async () => {
    mockData({ vehiculos: [vehiculo()], disponibles: [cochera()] });
    postMock.mockResolvedValue({ data: {} });
    const user = userEvent.setup();
    render(<ReservasContent modo="user" />);

    await screen.findByRole("option", { name: /ABC123 — AUTO/ });
    await user.selectOptions(screen.getByLabelText("Patente"), "ABC123");
    await screen.findByRole("option", { name: /A-01/ });
    await user.selectOptions(screen.getByLabelText("Cochera"), "c1");
    await user.click(screen.getByRole("button", { name: /confirmar reserva/i }));

    await waitFor(() => expect(postMock).toHaveBeenCalled());

    const [, body] = postMock.mock.calls[0];
    expect(body.visitanteId).toBeUndefined();
    expect(body).toMatchObject({ vehiculoId: "veh1", cocheraId: "c1" });
  });

  it("lista solo la patente, sin el nombre del visitante", async () => {
    mockData({
      vehiculos: [vehiculo()],
      reservas: [
        {
          id: "r1",
          fecha: "2026-01-01",
          estado: "CONFIRMADA",
          visitante: { nombre: "Juan Perez" },
          vehiculo: { patente: "ABC123" },
          cochera: { numero: "A-01", sector: "Planta Baja" },
        },
      ],
    });
    render(<ReservasContent modo="user" />);

    expect(await screen.findByText("Mis reservas")).toBeInTheDocument();
    expect(screen.queryByText("Juan Perez — ABC123")).not.toBeInTheDocument();
  });
});
