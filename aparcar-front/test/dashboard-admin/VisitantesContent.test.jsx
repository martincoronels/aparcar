import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const { postMock, toastSuccessMock, toastErrorMock } = vi.hoisted(() => ({
  postMock: vi.fn(),
  toastSuccessMock: vi.fn(),
  toastErrorMock: vi.fn(),
}));

vi.mock("@/app/api", () => ({ default: { post: postMock } }));
vi.mock("sonner", () => ({ toast: { success: toastSuccessMock, error: toastErrorMock } }));

const { default: VisitantesContent } = await import("@/app/dashboard-admin/VisitantesContent");

async function completarFormulario(user, overrides = {}) {
  const valores = {
    nombre: "Juan Perez",
    documento: "30111222",
    patente: "ABC123",
    ...overrides,
  };
  if (valores.nombre) await user.type(screen.getByPlaceholderText("Nombre completo"), valores.nombre);
  if (valores.documento) await user.type(screen.getByPlaceholderText("DNI / documento"), valores.documento);
  if (valores.patente) await user.type(screen.getByPlaceholderText("ABC123 / AB123CD"), valores.patente);
}

describe("VisitantesContent (admin carga visitante + vehiculo)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("muestra errores si se envia el formulario vacio", async () => {
    const user = userEvent.setup();
    render(<VisitantesContent />);

    await user.click(screen.getByRole("button", { name: /guardar visitante/i }));

    expect(await screen.findByText("El nombre es obligatorio")).toBeInTheDocument();
    expect(screen.getByText("El documento es obligatorio")).toBeInTheDocument();
    expect(screen.getByText("La patente es obligatoria")).toBeInTheDocument();
    expect(postMock).not.toHaveBeenCalled();
  });

  it("rechaza una patente con formato invalido", async () => {
    const user = userEvent.setup();
    render(<VisitantesContent />);

    await completarFormulario(user, { patente: "123" });
    await user.click(screen.getByRole("button", { name: /guardar visitante/i }));

    expect(await screen.findByText("Formato inválido (ej: ABC123 o AB123CD)")).toBeInTheDocument();
    expect(postMock).not.toHaveBeenCalled();
  });

  it("crea el visitante y despues el vehiculo con el visitanteId devuelto", async () => {
    postMock.mockResolvedValueOnce({ data: { id: "visitante-123" } }); // POST /visitantes
    postMock.mockResolvedValueOnce({ data: { id: "vehiculo-456" } }); // POST /vehiculos
    const user = userEvent.setup();
    render(<VisitantesContent />);

    await completarFormulario(user);
    await user.click(screen.getByRole("button", { name: /guardar visitante/i }));

    await waitFor(() => expect(postMock).toHaveBeenCalledTimes(2));

    const [visitanteUrl, visitanteBody] = postMock.mock.calls[0];
    expect(visitanteUrl).toBe("/api/v1/visitantes");
    expect(visitanteBody).toMatchObject({ nombre: "Juan Perez", documento: "30111222" });

    const [vehiculoUrl, vehiculoBody] = postMock.mock.calls[1];
    expect(vehiculoUrl).toBe("/api/v1/vehiculos");
    expect(vehiculoBody).toMatchObject({ patente: "ABC123", tipo: "AUTO", visitanteId: "visitante-123" });

    expect(toastSuccessMock).toHaveBeenCalledWith("Visitante y vehículo cargados correctamente");
  });

  it("si falla la creacion del visitante (ej. documento duplicado), no intenta crear el vehiculo", async () => {
    postMock.mockRejectedValueOnce({ response: { data: { message: "Ya existe un visitante con ese documento." } } });
    const user = userEvent.setup();
    render(<VisitantesContent />);

    await completarFormulario(user);
    await user.click(screen.getByRole("button", { name: /guardar visitante/i }));

    await waitFor(() =>
      expect(toastErrorMock).toHaveBeenCalledWith("Ya existe un visitante con ese documento.")
    );
    expect(postMock).toHaveBeenCalledTimes(1);
  });

  it("si falla la creacion del vehiculo (ej. patente duplicada), muestra el error del backend", async () => {
    postMock.mockResolvedValueOnce({ data: { id: "visitante-123" } });
    postMock.mockRejectedValueOnce({ response: { data: { message: "Ya existe un vehiculo con esa patente." } } });
    const user = userEvent.setup();
    render(<VisitantesContent />);

    await completarFormulario(user);
    await user.click(screen.getByRole("button", { name: /guardar visitante/i }));

    await waitFor(() =>
      expect(toastErrorMock).toHaveBeenCalledWith("Ya existe un vehiculo con esa patente.")
    );
  });
});
