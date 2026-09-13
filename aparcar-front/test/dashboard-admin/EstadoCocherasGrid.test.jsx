import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

const { getMock, toastErrorMock } = vi.hoisted(() => ({
  getMock: vi.fn(),
  toastErrorMock: vi.fn(),
}));

vi.mock("@/app/api", () => ({ default: { get: getMock } }));
vi.mock("sonner", () => ({ toast: { error: toastErrorMock } }));

const { default: EstadoCocherasGrid } = await import("@/app/dashboard-admin/EstadoCocherasGrid");

function mockCocheras(todas, disponibles) {
  getMock.mockImplementation((url) => {
    if (url === "/api/v1/cocheras") return Promise.resolve({ data: todas });
    if (url === "/api/v1/cocheras/disponibles") return Promise.resolve({ data: disponibles });
    return Promise.reject(new Error(`URL no mockeada: ${url}`));
  });
}

const cochera = (id, numero, tipo, estado = "HABILITADA") => ({ id, numero, tipo, estado });

describe("EstadoCocherasGrid", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("muestra el estado de carga mientras llegan los datos", () => {
    getMock.mockReturnValue(new Promise(() => {})); // nunca resuelve
    render(<EstadoCocherasGrid />);

    expect(screen.getByText("Cargando cocheras...")).toBeInTheDocument();
  });

  it("muestra el mensaje de vacio cuando no hay cocheras cargadas", async () => {
    mockCocheras([], []);
    render(<EstadoCocherasGrid />);

    expect(await screen.findByText("Todavía no hay cocheras cargadas.")).toBeInTheDocument();
  });

  it("agrupa las cocheras por tipo y solo muestra columnas con al menos una", async () => {
    mockCocheras(
      [cochera("1", "A-01", "AUTO"), cochera("2", "M-01", "MOTO")],
      [cochera("1", "A-01", "AUTO"), cochera("2", "M-01", "MOTO")]
    );
    render(<EstadoCocherasGrid />);

    expect(await screen.findByText("Autos")).toBeInTheDocument();
    expect(screen.getByText("Motos")).toBeInTheDocument();
    expect(screen.queryByText("Remolques")).not.toBeInTheDocument();
    expect(screen.queryByText("Accesibles")).not.toBeInTheDocument();
  });

  it("marca como ocupada una cochera habilitada que no aparece en /disponibles", async () => {
    mockCocheras(
      [cochera("1", "A-01", "AUTO"), cochera("2", "A-02", "AUTO")],
      [cochera("2", "A-02", "AUTO")] // A-01 no está disponible hoy => ocupada
    );
    render(<EstadoCocherasGrid />);

    await waitFor(() => expect(screen.getByText("1/2 ocupadas")).toBeInTheDocument());
    expect(screen.getByTitle("A-01 — Ocupada")).toBeInTheDocument();
    expect(screen.getByTitle("A-02 — Libre")).toBeInTheDocument();
  });

  it("una cochera DESHABILITADA se muestra como tal y no cuenta como ocupada", async () => {
    mockCocheras(
      [cochera("1", "A-01", "AUTO", "DESHABILITADA")],
      [] // deshabilitada nunca aparece en disponibles
    );
    render(<EstadoCocherasGrid />);

    expect(await screen.findByTitle("A-01 — Deshabilitada")).toBeInTheDocument();
    // El contador de ocupadas no debe incluir a las deshabilitadas.
    expect(screen.getByText("0/1 ocupadas")).toBeInTheDocument();
  });

  it("si falla la carga, muestra un toast de error", async () => {
    getMock.mockRejectedValue({ response: { data: { message: "Error de red" } } });
    render(<EstadoCocherasGrid />);

    await waitFor(() => expect(toastErrorMock).toHaveBeenCalledWith("Error de red"));
  });
});
