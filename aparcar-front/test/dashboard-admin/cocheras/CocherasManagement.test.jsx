import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const { getMock, postMock, putMock, deleteMock, toastSuccessMock, toastErrorMock } = vi.hoisted(() => ({
  getMock: vi.fn(),
  postMock: vi.fn(),
  putMock: vi.fn(),
  deleteMock: vi.fn(),
  toastSuccessMock: vi.fn(),
  toastErrorMock: vi.fn(),
}));

vi.mock("@/app/api", () => ({
  default: { get: getMock, post: postMock, put: putMock, delete: deleteMock },
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
}));
vi.mock("sonner", () => ({ toast: { success: toastSuccessMock, error: toastErrorMock } }));

const { default: CocherasManagement } = await import("@/app/dashboard-admin/cocheras/CocherasManagement");

const cochera = (overrides = {}) => ({
  id: "1",
  numero: "A-01",
  sector: "Planta Baja",
  tipo: "AUTO",
  estado: "HABILITADA",
  disponibleEnFecha: null,
  ...overrides,
});

// El componente pide dos cosas distintas por GET /api/v1/cocheras: una sin
// params (para el dropdown de sectores, siempre la lista completa) y otra con
// params (la tabla, filtrada). Este helper simula ambas a la vez.
function mockCocheras(todasLasCocheras, filtradas = todasLasCocheras) {
  getMock.mockImplementation((url, config) => {
    if (url !== "/api/v1/cocheras") return Promise.reject(new Error(`URL no mockeada: ${url}`));
    const sinParams = !config?.params || Object.keys(config.params).length === 0;
    return Promise.resolve({ data: sinParams ? todasLasCocheras : filtradas });
  });
}

describe("CocherasManagement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCocheras([]);
  });

  it("muestra la navegación de regreso al panel", () => {
    render(<CocherasManagement />);

    expect(screen.getByRole("link", { name: "← Volver al panel" }))
      .toHaveAttribute("href", "/dashboard-admin");
  });

  it("carga y lista las cocheras existentes", async () => {
    mockCocheras([cochera(), cochera({ id: "2", numero: "M-01", tipo: "MOTO" })]);
    render(<CocherasManagement />);

    expect(await screen.findByText("A-01")).toBeInTheDocument();
    expect(screen.getByText("M-01")).toBeInTheDocument();
  });

  it("el dropdown de sector se arma con los sectores reales, sin repetidos", async () => {
    mockCocheras([
      cochera({ sector: "Planta Baja" }),
      cochera({ id: "2", numero: "A-02", sector: "Planta Baja" }),
      cochera({ id: "3", numero: "S-01", sector: "Subsuelo" }),
    ]);
    render(<CocherasManagement />);
    await screen.findByText("A-01");

    const selectSector = screen.getByDisplayValue("Todos los sectores");
    const opciones = Array.from(selectSector.querySelectorAll("option")).map((o) => o.textContent);
    expect(opciones).toEqual(["Todos los sectores", "Planta Baja", "Subsuelo"]);
  });

  it("filtra por sector pidiendole al backend, no en el cliente", async () => {
    mockCocheras(
      [cochera({ sector: "Planta Baja" }), cochera({ id: "2", numero: "A-02", sector: "Subsuelo" })],
      [cochera({ id: "2", numero: "A-02", sector: "Subsuelo" })]
    );
    const user = userEvent.setup();
    render(<CocherasManagement />);
    await screen.findByText("A-01");

    const selectSector = screen.getByDisplayValue("Todos los sectores");
    await user.selectOptions(selectSector, "Subsuelo");

    await waitFor(() =>
      expect(getMock).toHaveBeenCalledWith(
        "/api/v1/cocheras",
        expect.objectContaining({ params: expect.objectContaining({ sector: "Subsuelo" }) })
      )
    );
    expect(await screen.findByText("A-02")).toBeInTheDocument();
    expect(screen.queryByText("A-01")).not.toBeInTheDocument();
  });

  it("filtra por tipo pidiendole al backend", async () => {
    mockCocheras(
      [cochera({ tipo: "AUTO" }), cochera({ id: "2", numero: "M-01", tipo: "MOTO" })],
      [cochera({ id: "2", numero: "M-01", tipo: "MOTO" })]
    );
    const user = userEvent.setup();
    render(<CocherasManagement />);
    await screen.findByText("A-01");

    const [filtroTipoSelect] = screen.getAllByDisplayValue("Todos los tipos");
    await user.selectOptions(filtroTipoSelect, "MOTO");

    await waitFor(() =>
      expect(getMock).toHaveBeenCalledWith(
        "/api/v1/cocheras",
        expect.objectContaining({ params: expect.objectContaining({ tipo: "MOTO" }) })
      )
    );
    expect(await screen.findByText("M-01")).toBeInTheDocument();
    expect(screen.queryByText("A-01")).not.toBeInTheDocument();
  });

  it("sin fecha seleccionada, la columna de disponibilidad muestra un guion", async () => {
    mockCocheras([cochera({ disponibleEnFecha: null })]);
    render(<CocherasManagement />);

    await screen.findByText("A-01");
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("al elegir una fecha, pide al backend con ese parametro y muestra Libre/Ocupada", async () => {
    mockCocheras(
      [cochera({ disponibleEnFecha: null })],
      [cochera({ disponibleEnFecha: false })]
    );
    const user = userEvent.setup();
    render(<CocherasManagement />);
    await screen.findByText("A-01");

    await user.type(screen.getByLabelText("Filtrar por fecha"), "2026-06-15");

    await waitFor(() =>
      expect(getMock).toHaveBeenCalledWith(
        "/api/v1/cocheras",
        expect.objectContaining({ params: expect.objectContaining({ fecha: "2026-06-15" }) })
      )
    );
    expect(await screen.findByText("Ocupada")).toBeInTheDocument();
  });

  it("crea una cochera nueva y refresca la lista y los sectores", async () => {
    postMock.mockResolvedValue({ data: cochera() });
    const user = userEvent.setup();
    render(<CocherasManagement />);
    await waitFor(() => expect(getMock).toHaveBeenCalledTimes(1));

    await user.type(screen.getByPlaceholderText("A-01"), "A-01");
    await user.type(screen.getByPlaceholderText("Planta Baja"), "Planta Baja");
    await user.click(screen.getByRole("button", { name: /crear cochera/i }));

    await waitFor(() =>
      expect(postMock).toHaveBeenCalledWith(
        "/api/v1/cocheras",
        expect.objectContaining({ numero: "A-01", sector: "Planta Baja", tipo: "AUTO", estado: "HABILITADA" })
      )
    );
    expect(toastSuccessMock).toHaveBeenCalledWith("Cochera creada correctamente");
    // Refresca tanto la lista filtrada como el dropdown de sectores (2 llamadas mas).
    await waitFor(() => expect(getMock.mock.calls.length).toBeGreaterThanOrEqual(3));
  });

  it("muestra errores de validacion si falta numero o sector", async () => {
    const user = userEvent.setup();
    render(<CocherasManagement />);

    await user.click(screen.getByRole("button", { name: /crear cochera/i }));

    expect(await screen.findByText("El número es obligatorio")).toBeInTheDocument();
    expect(screen.getByText("El sector es obligatorio")).toBeInTheDocument();
    expect(postMock).not.toHaveBeenCalled();
  });

  it("al editar, precarga el formulario con los datos de la fila elegida", async () => {
    mockCocheras([cochera({ sector: "Planta Baja" })]);
    const user = userEvent.setup();
    render(<CocherasManagement />);
    await screen.findByText("A-01");

    await user.click(screen.getByRole("button", { name: /^editar$/i }));

    expect(screen.getByDisplayValue("A-01")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Planta Baja")).toBeInTheDocument();
  });

  it("al deshabilitar una cochera antes HABILITADA, pide confirmacion; si se cancela, no llama a PUT", async () => {
    mockCocheras([cochera()]);
    vi.spyOn(window, "confirm").mockReturnValue(false);
    const user = userEvent.setup();
    render(<CocherasManagement />);
    await screen.findByText("A-01");

    await user.click(screen.getByRole("button", { name: /^editar$/i }));
    const [, estadoSelect] = screen.getAllByDisplayValue("Habilitada");
    await user.selectOptions(estadoSelect, "DESHABILITADA");
    await user.click(screen.getByRole("button", { name: /guardar cambios/i }));

    expect(window.confirm).toHaveBeenCalled();
    expect(putMock).not.toHaveBeenCalled();
  });

  it("al deshabilitar y confirmar, llama a PUT con el nuevo estado", async () => {
    mockCocheras([cochera()]);
    putMock.mockResolvedValue({ data: cochera({ estado: "DESHABILITADA" }) });
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const user = userEvent.setup();
    render(<CocherasManagement />);
    await screen.findByText("A-01");

    await user.click(screen.getByRole("button", { name: /^editar$/i }));
    const [, estadoSelect] = screen.getAllByDisplayValue("Habilitada");
    await user.selectOptions(estadoSelect, "DESHABILITADA");
    await user.click(screen.getByRole("button", { name: /guardar cambios/i }));

    await waitFor(() =>
      expect(putMock).toHaveBeenCalledWith(
        "/api/v1/cocheras/1",
        expect.objectContaining({ estado: "DESHABILITADA" })
      )
    );
  });

  it("eliminar pide confirmacion, y si se cancela no llama a DELETE", async () => {
    mockCocheras([cochera()]);
    vi.spyOn(window, "confirm").mockReturnValue(false);
    const user = userEvent.setup();
    render(<CocherasManagement />);
    await screen.findByText("A-01");

    await user.click(screen.getByRole("button", { name: /eliminar/i }));

    expect(window.confirm).toHaveBeenCalledWith("¿Seguro que querés eliminar la cochera A-01?");
    expect(deleteMock).not.toHaveBeenCalled();
  });

  it("eliminar, si se confirma, llama a DELETE y refresca la lista", async () => {
    mockCocheras([cochera()]);
    deleteMock.mockResolvedValue({});
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const user = userEvent.setup();
    render(<CocherasManagement />);
    await screen.findByText("A-01");

    await user.click(screen.getByRole("button", { name: /eliminar/i }));

    await waitFor(() => expect(deleteMock).toHaveBeenCalledWith("/api/v1/cocheras/1"));
    expect(toastSuccessMock).toHaveBeenCalledWith("Cochera eliminada correctamente");
  });
});