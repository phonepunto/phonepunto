import { test, expect } from '@playwright/test';
import { VentasPage } from './pages/VentasPage';
import { ProductosPage } from './pages/ProductosPage';
import { ClientesPage } from './pages/ClientesPage';

test.describe('Pruebas E2E: Gestión de Ventas', () => {
  test('Debería realizar un flujo de venta normal completo con descuentos y pagos', async ({ page }) => {
    const ventasPage = new VentasPage(page);
    const productosPage = new ProductosPage(page);
    const clientesPage = new ClientesPage(page);

    await clientesPage.goto();
    const cliente = await clientesPage.inyectarClienteEfimero();

    await productosPage.goto();
    const producto = await productosPage.inyectarProductoEfimero();

    await ventasPage.goto();
    await ventasPage.abrirModalVenta();
    await ventasPage.elegirCliente(cliente.nombre);
    await ventasPage.elegirProducto(producto.equipo, producto.descripcion);
    await ventasPage.confirmarCarrito();

    await ventasPage.aplicarDescuento('10', '50');
    await ventasPage.confirmarDescuento();

    await ventasPage.agregarMetodoEfectivo();

    await ventasPage.finalizarFactura();

    await expect(page.getByText('Venta realizada con éxito')).toBeVisible();

    await ventasPage.buscarVenta(cliente.nombre);
    const filaVenta = ventasPage.obtenerFilaPorNombre(cliente.nombre);
    await expect(filaVenta).toBeVisible();
  });

  test('Debería permitir realizar pagos parciales y completar el saldo pendiente', async ({ page }) => {
    const ventasPage = new VentasPage(page);
    const productosPage = new ProductosPage(page);
    const clientesPage = new ClientesPage(page);

    // 1. Setup client and product
    await clientesPage.goto();
    const cliente = await clientesPage.inyectarClienteEfimero();

    await productosPage.goto();
    const producto = await productosPage.inyectarProductoEfimero();

    // 2. Go to sales page and create sale
    await ventasPage.goto();
    await ventasPage.abrirModalVenta();
    await ventasPage.elegirCliente(cliente.nombre);
    await ventasPage.elegirProducto(producto.equipo, producto.descripcion);
    await ventasPage.confirmarCarrito();

    // 3. Skip discounts
    await ventasPage.omitirDescuento();

    // 4. Add a partial payment (e.g. 100 on a larger total)
    // The product base price injected is 1000 by default (since totalVenta is not specified)
    // We add 400.00 cash payment
    await ventasPage.agregarMetodoEfectivo('400');
    await ventasPage.finalizarFactura();

    // 5. Verify success and status 'Parcial'
    await expect(page.getByText('Venta realizada con éxito')).toBeVisible();
    await ventasPage.buscarVenta(cliente.nombre);
    const filaVenta = ventasPage.obtenerFilaPorNombre(cliente.nombre);
    await expect(filaVenta.getByText('Parcial (Falta $600,00)')).toBeVisible();

    // 6. Manage payments (open modal)
    await filaVenta.getByTitle('Gestionar Pagos').click();
    await expect(page.getByText('Historial de Pagos')).toBeVisible();

    // 7. Complete the payment with a transfer of 600
    await page.getByRole('button', { name: 'Transferencia', exact: true }).click();
    await page.getByPlaceholder('0,00').fill('600');
    await page.getByRole('button', { name: 'Pagar', exact: true }).click();

    // 8. Verify status updates to Pagado
    await expect(page.getByText('Pago registrado con éxito')).toBeVisible();
    await expect(page.getByText('Saldo Restante')).toContainText('$0,00');
    
    // Close modal and check the list status badge is updated
    await page.keyboard.press('Escape');
    await expect(filaVenta.getByText('Pagado')).toBeVisible();
  });
});
