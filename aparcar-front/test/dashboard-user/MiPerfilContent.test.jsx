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

const { default: MiPerfilContent } = await import("@/app/dashboard-user/MiPerfilContent");

describe("MiPerfilContent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("muestra el estado de carga inicialmente", () => {
    getMock.mockReturnValue(new Promise(() => {}));
    render(<MiPerfilContent />);

    expect(screen.getByText("Cargando tus datos...")).toBeInTheDocument();
  });

  it("si la cuenta todavia no tiene perfil (404), muestra el formulario de autoregistro", async () => {
    getMock.mockRejectedValue({ response: { status: 404 } });
    render(<MiPerfilContent />);

    expect(await screen.findByText("Cargá tus datos una sola vez para poder reservar una cochera.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /guardar mis datos/i })).toBeInTheDocument();
  });

  it("si ya tiene perfil, muestra sus datos y sus vehiculos", async () => {
    getMock.mockImplementation((url) => {
      if (url === "/api/v1/visitantes/me")
        return Promise.resolve({ data: { id: "v1", nombre: "Juan Perez", documento: "30111222" } });
      if (url === "/api/v1/vehiculos")
        return Promise.resolve({ data: [{ id: "veh1", patente: "ABC123", tipo: "AUTO" }] });
      return Promise.reject(new Error("URL no mockeada"));
    });
    render(<MiPerfilContent />);

    expect(await screen.findByText("Juan Perez")).toBeInTheDocument();
    expect(screen.getByText(/Documento 30111222/)).toBeInTheDocument();
    expect(screen.getByText("ABC123")).toBeInTheDocument();
    await waitFor(() =>
      expect(getMock).toHaveBeenCalledWith("/api/v1/vehiculos", { params: { visitanteId: "v1" } })
    );
  });

  it("si ya tiene perfil pero ningun vehiculo, avisa que todavia no cargo ninguno", async () => {
    getMock.mockImplementation((url) => {
      if (url === "/api/v1/visitantes/me")
        return Promise.resolve({ data: { id: "v1", nombre: "Juan Perez", documento: "30111222" } });
      if (url === "/api/v1/vehiculos") return Promise.resolve({ data: [] });
      return Promise.reject(new Error("URL no mockeada"));
    });
    render(<MiPerfilContent />);

    expect(await screen.findByText("Todavía no cargaste ningún vehículo.")).toBeInTheDocument();
  });

  it("un error que no es 404 al cargar el perfil muestra un toast de error", async () => {
    getMock.mockRejectedValue({ response: { status: 500 } });
    render(<MiPerfilContent />);

    await waitFor(() => expect(toastErrorMock).toHaveBeenCalledWith("No se pudieron cargar tus datos."));
  });

  it("muestra errores de validacion al enviar el formulario de autoregistro vacio", async () => {
    getMock.mockRejectedValue({ response: { status: 404 } });
    const user = userEvent.setup();
    render(<MiPerfilContent />);
    await screen.findByRole("button", { name: /guardar mis datos/i });

    await user.click(screen.getByRole("button", { name: /guardar mis datos/i }));

    expect(await screen.findByText("El nombre es obligatorio")).toBeInTheDocument();
    expect(screen.getByText("El documento es obligatorio")).toBeInTheDocument();
    expect(postMock).not.toHaveBeenCalled();
  });

  it("crea el perfil propio y pasa a mostrar la vista de datos guardados", async () => {
    getMock.mockRejectedValue({ response: { status: 404 } });
    postMock.mockResolvedValue({ data: { id: "v1", nombre: "Juan Perez", documento: "30111222" } });
    const user = userEvent.setup();
    render(<MiPerfilContent />);
    await screen.findByRole("button", { name: /guardar mis datos/i });

    await user.type(screen.getByPlaceholderText("Nombre completo"), "Juan Perez");
    await user.type(screen.getByPlaceholderText("DNI / documento"), "30111222");
    await user.click(screen.getByRole("button", { name: /guardar mis datos/i }));

    await waitFor(() =>
      expect(postMock).toHaveBeenCalledWith(
        "/api/v1/visitantes/me",
        expect.objectContaining({ nombre: "Juan Perez", documento: "30111222" })
      )
    );
    expect(toastSuccessMock).toHaveBeenCalledWith("Tus datos quedaron registrados");
    expect(await screen.findByText("Juan Perez")).toBeInTheDocument();
  });

  it("si falla la creacion del perfil (ej. cuenta ya tiene uno), muestra el error del backend", async () => {
    getMock.mockRejectedValue({ response: { status: 404 } });
    postMock.mockRejectedValue({ response: { data: { message: "Tu cuenta ya tiene un visitante cargado." } } });
    const user = userEvent.setup();
    render(<MiPerfilContent />);
    await screen.findByRole("button", { name: /guardar mis datos/i });

    await user.type(screen.getByPlaceholderText("Nombre completo"), "Juan Perez");
    await user.type(screen.getByPlaceholderText("DNI / documento"), "30111222");
    await user.click(screen.getByRole("button", { name: /guardar mis datos/i }));

    await waitFor(() =>
      expect(toastErrorMock).toHaveBeenCalledWith("Tu cuenta ya tiene un visitante cargado.")
    );
  });

  it("agregar un vehiculo con patente invalida muestra el error de formato", async () => {
    getMock.mockImplementation((url) => {
      if (url === "/api/v1/visitantes/me")
        return Promise.resolve({ data: { id: "v1", nombre: "Juan Perez", documento: "30111222" } });
      if (url === "/api/v1/vehiculos") return Promise.resolve({ data: [] });
      return Promise.reject(new Error("URL no mockeada"));
    });
    const user = userEvent.setup();
    render(<MiPerfilContent />);
    await screen.findByText("Juan Perez");

    await user.type(screen.getByPlaceholderText("ABC123 / AB123CD"), "123");
    await user.click(screen.getByRole("button", { name: /agregar/i }));

    expect(await screen.findByText("Formato inválido (ej: ABC123 o AB123CD)")).toBeInTheDocument();
    expect(postMock).not.toHaveBeenCalled();
  });

  it("agrega un vehiculo propio y refresca la lista", async () => {
    getMock.mockImplementation((url) => {
      if (url === "/api/v1/visitantes/me")
        return Promise.resolve({ data: { id: "v1", nombre: "Juan Perez", documento: "30111222" } });
      if (url === "/api/v1/vehiculos") return Promise.resolve({ data: [] });
      return Promise.reject(new Error("URL no mockeada"));
    });
    postMock.mockResolvedValue({ data: { id: "veh1", patente: "ABC123", tipo: "AUTO" } });
    const user = userEvent.setup();
    render(<MiPerfilContent />);
    await screen.findByText("Juan Perez");

    await user.type(screen.getByPlaceholderText("ABC123 / AB123CD"), "ABC123");
    await user.click(screen.getByRole("button", { name: /agregar/i }));

    await waitFor(() =>
      expect(postMock).toHaveBeenCalledWith(
        "/api/v1/vehiculos",
        expect.objectContaining({ patente: "ABC123", tipo: "AUTO", visitanteId: "v1" })
      )
    );
    expect(toastSuccessMock).toHaveBeenCalledWith("Vehículo agregado correctamente");
    // Recarga los vehiculos: GET /vehiculos se llama de nuevo despues del alta.
    await waitFor(() =>
      expect(getMock.mock.calls.filter((c) => c[0] === "/api/v1/vehiculos").length).toBeGreaterThanOrEqual(2)
    );
  });
});
