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
 * `disponiblesPorLlamada` permite simular que, después de reservar, la cochera
 * deja de estar disponible: la primera carga la devuelve libre y la segunda no.
 */
function mockApi({ disponiblesPorLlamada = [[COCHERA]] } = {}) {
  let llamadasDisponibles = 0;

  getMock.mockImplementation((url) => {
    if (url === "/api/v1/cocheras") return Promise.resolve({ data: [COCHERA] });
    if (url === "/api/v1/cocheras/disponibles") {
      const i = Math.min(llamadasDisponibles, disponiblesPorLlamada.length - 1);
      llamadasDisponibles += 1;
      return Promise.resolve({ data: disponiblesPorLlamada[i] });
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
    // 1ra carga de la grilla: libre. 2da (la del form): libre. 3ra: ya ocupada.
    mockApi({ disponiblesPorLlamada: [[COCHERA], [COCHERA], []] });
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
});
