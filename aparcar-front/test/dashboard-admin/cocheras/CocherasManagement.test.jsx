import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
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
  ...overrides,
});

describe("CocherasManagement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getMock.mockResolvedValue({ data: [] });
  });

  it("muestra la navegación de regreso al panel", () => {
    render(<CocherasManagement />);

    expect(screen.getByRole("link", { name: "← Volver al panel" }))
      .toHaveAttribute("href", "/dashboard-admin");
  });

  it("carga y lista las cocheras existentes", async () => {
    getMock.mockResolvedValue({ data: [cochera(), cochera({ id: "2", numero: "M-01", tipo: "MOTO" })] });
    render(<CocherasManagement />);

    expect(await screen.findByText("A-01")).toBeInTheDocument();
    expect(screen.getByText("M-01")).toBeInTheDocument();
  });

  it("filtra por sector", async () => {
    getMock.mockResolvedValue({
      data: [cochera({ sector: "Planta Baja" }), cochera({ id: "2", numero: "A-02", sector: "Subsuelo" })],
    });
    const user = userEvent.setup();
    render(<CocherasManagement />);
    await screen.findByText("A-01");

    await user.type(screen.getByPlaceholderText("Filtrar por sector..."), "subsuelo");

    expect(screen.queryByText("A-01")).not.toBeInTheDocument();
    expect(screen.getByText("A-02")).toBeInTheDocument();
  });

  it("filtra por tipo", async () => {
    getMock.mockResolvedValue({
      data: [cochera({ tipo: "AUTO" }), cochera({ id: "2", numero: "M-01", tipo: "MOTO" })],
    });
    const user = userEvent.setup();
    render(<CocherasManagement />);
    await screen.findByText("A-01");

    const [filtroTipoSelect] = screen.getAllByDisplayValue("Todos los tipos");
    await user.selectOptions(filtroTipoSelect, "MOTO");

    expect(screen.queryByText("A-01")).not.toBeInTheDocument();
    expect(screen.getByText("M-01")).toBeInTheDocument();
  });

  it("crea una cochera nueva y refresca la lista", async () => {
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
    // Recarga la lista despues de crear.
    await waitFor(() => expect(getMock).toHaveBeenCalledTimes(2));
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
    getMock.mockResolvedValue({ data: [cochera({ sector: "Planta Baja" })] });
    const user = userEvent.setup();
    render(<CocherasManagement />);
    await screen.findByText("A-01");

    await user.click(screen.getByRole("button", { name: /^editar$/i }));

    expect(screen.getByDisplayValue("A-01")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Planta Baja")).toBeInTheDocument();
  });

  it("al deshabilitar una cochera antes HABILITADA, pide confirmacion; si se cancela, no llama a PUT", async () => {
    getMock.mockResolvedValue({ data: [cochera()] });
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
    getMock.mockResolvedValue({ data: [cochera()] });
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
    getMock.mockResolvedValue({ data: [cochera()] });
    vi.spyOn(window, "confirm").mockReturnValue(false);
    const user = userEvent.setup();
    render(<CocherasManagement />);
    await screen.findByText("A-01");

    await user.click(screen.getByRole("button", { name: /eliminar/i }));

    expect(window.confirm).toHaveBeenCalledWith("¿Seguro que querés eliminar la cochera A-01?");
    expect(deleteMock).not.toHaveBeenCalled();
  });

  it("eliminar, si se confirma, llama a DELETE y refresca la lista", async () => {
    getMock.mockResolvedValue({ data: [cochera()] });
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
