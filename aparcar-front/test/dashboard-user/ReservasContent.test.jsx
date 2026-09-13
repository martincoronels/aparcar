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

const { default: ReservasContent } = await import("@/app/dashboard-user/ReservasContent");

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

describe("ReservasContent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("muestra el mensaje de vacio cuando no hay reservas cargadas", async () => {
    mockData({});
    render(<ReservasContent />);

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
    render(<ReservasContent />);

    expect(await screen.findByText("Juan Perez — ABC123")).toBeInTheDocument();
    expect(screen.getByText("CONFIRMADA")).toBeInTheDocument();
  });

  it("al escribir una patente registrada, muestra el nombre del visitante y el tipo de vehiculo", async () => {
    mockData({ visitantes: [visitante()], vehiculos: [vehiculo()] });
    const user = userEvent.setup();
    render(<ReservasContent />);
    await waitFor(() => expect(getMock).toHaveBeenCalledWith("/api/v1/vehiculos"));

    await user.type(screen.getByPlaceholderText("ABC123 / AB123CD"), "ABC123");

    expect(await screen.findByText("Juan Perez — AUTO")).toBeInTheDocument();
  });

  it("al escribir una patente que no existe, avisa que no se encontro ningun vehiculo", async () => {
    mockData({});
    const user = userEvent.setup();
    render(<ReservasContent />);
    await waitFor(() => expect(getMock).toHaveBeenCalledWith("/api/v1/vehiculos"));

    await user.type(screen.getByPlaceholderText("ABC123 / AB123CD"), "ZZZ999");

    expect(
      await screen.findByText("No hay ningún vehículo registrado con esa patente.")
    ).toBeInTheDocument();
  });

  it("la cochera queda deshabilitada hasta encontrar un vehiculo por patente", async () => {
    mockData({});
    render(<ReservasContent />);
    await waitFor(() => expect(getMock).toHaveBeenCalledWith("/api/v1/vehiculos"));

    expect(screen.getByLabelText("Cochera")).toBeDisabled();
  });

  it("al resolver un vehiculo (con fecha ya cargada por defecto), pide las cocheras disponibles de ese tipo", async () => {
    mockData({ visitantes: [visitante()], vehiculos: [vehiculo()], disponibles: [cochera()] });
    const user = userEvent.setup();
    render(<ReservasContent />);
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

  // Regresion del bug real: si se carga un vehiculo nuevo en "Mis datos"
  // (arriba, en la misma pagina), esta lista ya se habia pedido antes de que
  // existiera. El fix fue re-pedirla al hacer foco en el campo de patente.
  it("el foco en el campo de patente vuelve a pedir vehiculos y visitantes", async () => {
    mockData({});
    const user = userEvent.setup();
    render(<ReservasContent />);
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
    render(<ReservasContent />);
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
    render(<ReservasContent />);
    await waitFor(() => expect(getMock).toHaveBeenCalledWith("/api/v1/vehiculos"));

    expect(screen.getByRole("button", { name: /confirmar reserva/i })).toBeDisabled();
  });
});
