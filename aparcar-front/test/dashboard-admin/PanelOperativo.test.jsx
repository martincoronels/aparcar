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
vi.mock("sonner", () => ({
  toast: { success: toastSuccessMock, error: toastErrorMock },
}));

const { default: PanelOperativo } = await import("@/app/dashboard-admin/PanelOperativo");

const COCHERA = { id: "c1", numero: "A-01", sector: "Planta Baja", tipo: "AUTO", estado: "HABILITADA" };
const VISITANTE = { id: "v1", nombre: "Juan Perez", documento: "30111222" };
const VEHICULO = { id: "veh1", patente: "ABC123", tipo: "AUTO", visitanteId: "v1" };

/**
 * `ocupacionPorLlamada` permite simular que, después de reservar, la cochera
 * deja de estar disponible: la primera carga la devuelve libre y la segunda no.
 *
 * Se distingue por los parámetros y no por el orden de las llamadas: la
 * cuadrícula pide la disponibilidad de todo el día (solo `fecha`), mientras que
 * los formularios la piden filtrada por tipo de vehículo. Contar llamadas se
 * volvió frágil cuando el alta de visitante pasó a pedir cocheras también.
 */
function mockApi({ ocupacionPorLlamada = [[COCHERA]] } = {}) {
  let llamadasOcupacion = 0;

  getMock.mockImplementation((url, config) => {
    if (url === "/api/v1/cocheras") return Promise.resolve({ data: [COCHERA] });
    if (url === "/api/v1/cocheras/disponibles") {
      if (config?.params?.tipoVehiculo) {
        return Promise.resolve({ data: [COCHERA] });
      }
      const i = Math.min(llamadasOcupacion, ocupacionPorLlamada.length - 1);
      llamadasOcupacion += 1;
      return Promise.resolve({ data: ocupacionPorLlamada[i] });
    }
    if (url === "/api/v1/visitantes") return Promise.resolve({ data: [VISITANTE] });
    if (url === "/api/v1/vehiculos") return Promise.resolve({ data: [VEHICULO] });
    if (url === "/api/v1/reservas") return Promise.resolve({ data: [] });
    return Promise.reject(new Error(`URL no mockeada: ${url}`));
  });
}

describe("PanelOperativo (dashboard ADMIN)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Regresión: el panel admin no tenía formulario de reservas. El único que
  // existía vivía en el dashboard-user, protegido con requireAuth(["USER"]),
  // así que una cuenta ADMIN no podía crear una reserva desde ningún lado.
  it("incluye el formulario de nueva reserva, no solo el alta de visitante", async () => {
    mockApi();
    render(<PanelOperativo />);

    expect(await screen.findByText("Nueva reserva")).toBeInTheDocument();
    expect(screen.getByText("Nuevo visitante")).toBeInTheDocument();
    expect(screen.getByText("Estado de las cocheras")).toBeInTheDocument();
  });

  it("el admin crea una reserva resolviendo el visitante por patente", async () => {
    const user = userEvent.setup();
    mockApi();
    postMock.mockResolvedValue({ data: { id: "r1" } });

    render(<PanelOperativo />);
    await screen.findByText("Nueva reserva");

    await user.type(document.getElementById("reserva-patente"), "abc123");
    expect(await screen.findByText(/Juan Perez/)).toBeInTheDocument();

    const selectCochera = await screen.findByLabelText("Cochera");
    await waitFor(() => expect(selectCochera).not.toBeDisabled());
    await user.selectOptions(selectCochera, "c1");

    await user.click(screen.getByRole("button", { name: /confirmar reserva/i }));

    await waitFor(() =>
      expect(postMock).toHaveBeenCalledWith("/api/v1/reservas", {
        visitanteId: "v1",
        vehiculoId: "veh1",
        cocheraId: "c1",
        fecha: expect.any(String),
      })
    );
    expect(toastSuccessMock).toHaveBeenCalledWith("Reserva creada correctamente");
  });

  // Regresión: aunque la reserva se creara, la cuadrícula seguía mostrando la
  // cochera libre hasta recargar la página, porque cargaba una sola vez al
  // montarse. Desde el fix, crear una reserva la obliga a volver a pedir datos.
  it("al crear la reserva refresca la cuadricula de ocupacion", async () => {
    const user = userEvent.setup();
    // 1ra carga de la grilla: libre. De ahí en más: ya ocupada.
    mockApi({ ocupacionPorLlamada: [[COCHERA], []] });
    postMock.mockResolvedValue({ data: { id: "r1" } });

    render(<PanelOperativo />);
    await screen.findByText("Nueva reserva");
    expect(await screen.findByText("0/1 ocupadas")).toBeInTheDocument();

    await user.type(document.getElementById("reserva-patente"), "abc123");
    const selectCochera = await screen.findByLabelText("Cochera");
    await waitFor(() => expect(selectCochera).not.toBeDisabled());
    await user.selectOptions(selectCochera, "c1");
    await user.click(screen.getByRole("button", { name: /confirmar reserva/i }));

    expect(await screen.findByText("1/1 ocupadas")).toBeInTheDocument();
  });

  // El alta de visitante ahora también reserva, así que tiene que mover la
  // cuadrícula igual que el formulario de reservas.
  it("dar de alta un visitante tambien refresca la cuadricula de ocupacion", async () => {
    const user = userEvent.setup();
    mockApi({ ocupacionPorLlamada: [[COCHERA], []] });
    postMock.mockResolvedValue({ data: {} });

    render(<PanelOperativo />);
    expect(await screen.findByText("0/1 ocupadas")).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText("Nombre completo"), "Ana Lopez");
    await user.type(screen.getByPlaceholderText("DNI / documento"), "30111222");
    await user.type(screen.getByPlaceholderText("Con esto inicia sesión"), "ana@test.com");
    // Por id: el panel tiene dos campos de patente (el del alta y el de la
    // reserva para un visitante ya registrado) y comparten placeholder.
    await user.type(document.getElementById("patente"), "XYZ789");
    await user.selectOptions(screen.getByLabelText("Cochera (hoy)"), "c1");
    await user.click(screen.getByRole("button", { name: /dar de alta y reservar/i }));

    await waitFor(() => expect(postMock).toHaveBeenCalledWith("/api/v1/visitantes/alta", expect.any(Object)));
    expect(await screen.findByText("1/1 ocupadas")).toBeInTheDocument();
  });
});
