# Calculadora de acidez y pH para crema al 40 %

Aplicación web instalable para estimar cuántos gramos de ácido comercial agregar a crema al 40 % de grasa para aumentar la acidez titulable (°D) o bajar el pH. Puedes instalarla desde GitHub Pages y usar la calculadora sin conexión después de la primera carga. Los datos y cálculos se quedan en el dispositivo.

## Uso

1. Abre la dirección publicada en GitHub Pages. En computadora también puedes descomprimir el ZIP y abrir `index.html` para probar los cálculos.
2. Selecciona **Acidez titulable (°D)** o **pH**. Los datos van en el orden en que se necesitan: **1 Lote** (cantidad y unidad), **2 Medición** (inicial y objetivo) y **3 Ácido** (tipo, pureza y, según el modo, el factor de pH o la calibración). Elige la unidad (L, mL, kg, g o mg) en el selector junto a la cantidad. Puedes usar coma o punto decimal, sin separador de miles. Las casillas numéricas están vacías al abrir la app.
3. Selecciona el ácido e indica su pureza en porcentaje en masa (% m/m) según su ficha técnica. La dosis se expresa en gramos del producto comercial, incluso si es líquido.
4. En modo pH, ingresa un factor validado para tu crema, el ácido y el intervalo de pH. En modo °D, puedes usar los factores de la tabla o la calibración opcional. Si usas una cantidad por masa, indica la densidad medida de la crema en kg/L. El campo aparece justo debajo de la cantidad.
5. Selecciona **Calcular dosis**. La dosis aparece en gramos de producto comercial y **Ver cálculo paso a paso** muestra las operaciones. Si el objetivo coincide con el valor inicial, la dosis es 0 g. La app rechaza los objetivos que requieren bajar °D o subir el pH.
6. Los mensajes de error aparecen junto al campo que debes corregir. **Borrar todo** limpia los datos, el ácido seleccionado, los errores y el resultado. Conserva el modo activo y vuelve a la unidad L.

## Unidades

- 1 L = 1 000 mL. 1 kg = 1 000 g = 1 000 000 mg.
- En ambos modos, el cálculo se hace en L. Si ingresas la cantidad por masa, primero se convierte a kg y luego se aplica `litros = kg ÷ densidad (kg/L)`. En sentido contrario, `kg = litros × densidad (kg/L)`.
- **Cambiar de unidad convierte el número.** Si ya escribiste una cantidad y cambias el selector, la app conserva la misma cantidad de crema: 2 L pasan a 2000 mL, y 2000 mL vuelven a 2 L. Los cambios entre L y mL o entre kg, g y mg no necesitan densidad.
- **Entre volumen y masa se necesita la densidad.** Si falta o no es válida, el campo **Densidad de la crema** aparece junto al selector. Mientras tanto se conservan el número y la unidad anteriores. Escribe la densidad (por ejemplo, 0,98) y toca **Convertir a …** o presiona Enter para completar el cambio. Si la casilla de cantidad está vacía, solo cambia la unidad.
- La prueba piloto usa la misma conversión, con su propio selector. La densidad es una sola y se comparte entre el lote y el piloto.
- La app guarda la cantidad sin redondear y solo redondea al mostrar. Cambiar de unidad varias veces no altera la dosis.
- La pureza siempre se expresa en porcentaje en masa. Las dosis del ácido comercial siempre se introducen y muestran en gramos.

## Cálculo en °D

`m = V × (D_objetivo − D_inicial) × F ÷ (pureza / 100)`

| Ácido | Factor teórico (g de ácido puro/L/°D) |
| --- | ---: |
| Láctico | 0,1000 |
| Acético | 0,0667 |
| Cítrico anhidro | 0,0711 |
| Cítrico monohidratado | 0,0778 |

1. **Convierte a litros** para aplicar un factor expresado por litro.
2. **Resta los °D iniciales de los °D objetivo** para saber cuánto debe subir la acidez titulable.
3. **Aplica el factor del ácido** para obtener los gramos de ácido puro requeridos. Usa el factor teórico de la tabla o el factor experimental del piloto.
4. **Divide entre la pureza como fracción** para obtener los gramos del producto comercial que vas a pesar.

Ejemplo con 100 L (100 000 mL), un aumento de 14 a 16 °D y ácido láctico al 80 % en masa. La masa estimada es `100 × (16 − 14) × 0,1000 ÷ 0,80 = 25 g` de producto comercial. Si la densidad medida del lote fuera 0,98 kg/L, 98 kg también equivaldrían a 100 L.

El cálculo con los factores de referencia es teórico. Realiza una prueba piloto y confirma por titulación el resultado antes de escalar. Usa el mismo método de titulación para las mediciones inicial y final.

### Calibración opcional

Abre **Calibración con prueba piloto** y activa **Usar el factor de la prueba piloto**. Registra la cantidad de crema del piloto, °D iniciales y medidos después de la adición, gramos de producto comercial agregados y la pureza que tenía ese producto. La calibración requiere un aumento medido mayor que cero.

`F_piloto = (masa agregada × pureza piloto / 100) ÷ (volumen piloto × aumento medido de °D)`

El resultado usa este factor en lugar del teórico y conserva la corrección por la pureza indicada para el lote. Usa la misma crema y tipo de ácido en el piloto.

## Cálculo en pH

Ingresa `F_pH` en gramos de ácido puro por litro y por unidad de pH que baja. La respuesta depende de la crema, el ácido y el intervalo. Usa un factor validado para esas condiciones. Cambiar de ácido o de modo limpia el factor ingresado.

`m = litros × (pH_inicial − pH_objetivo) × F_pH ÷ (pureza / 100)`

1. **Convierte a litros** para usar el factor por litro.
2. **Resta el pH objetivo del inicial** para calcular la bajada deseada.
3. **Multiplica por el factor** para estimar los gramos de ácido puro requeridos para esa bajada y ese volumen.
4. **Divide entre la pureza como fracción** para obtener los gramos de producto comercial.

Si tienes datos de una dosificación previa validada en el intervalo, calcula el factor con `F_pH = gramos de ácido puro usados ÷ (litros de crema × bajada de pH medida)`. Si pesaste producto comercial, multiplica los gramos usados por `pureza / 100` para obtener los gramos de ácido puro.

El resultado es una estimación. Confirma el pH con un equipo calibrado después de mezclar y estabilizar la lectura. Si también controlas °D, verifica la acidez titulable por titulación.

Ejemplo con 10 L, de pH 6,6 a 6,3, un factor validado de 0,2 g de ácido puro/L/pH y pureza de 80 %: `10 × (6,6 − 6,3) × 0,2 ÷ 0,80 = 0,75 g`. Son valores de prueba. La app no los trae precargados.

[Estudio experimental de curvas de amortiguamiento durante la acidificación de leche](https://www.journalofdairyscience.org/article/S0022-0302%2814%2900481-0/fulltext)

## Publicar en GitHub Pages

1. Descomprime el ZIP. Crea un repositorio en GitHub. Para usar GitHub Pages con GitHub Free, elige un repositorio público.
2. En **Code → Add file → Upload files**, sube todos los archivos descomprimidos directamente a la raíz de la rama `main`. Si ya habías publicado la calculadora, actualiza los archivos existentes y agrega los nuevos. Confirma los cambios con **Commit changes**.
3. En **Settings → Pages → Build and deployment**, elige **Deploy from a branch**. Selecciona la rama `main` y la carpeta `/(root)`. Guarda con **Save**.
4. Cuando termine el despliegue, abre el enlace HTTPS que aparece en **Settings → Pages**. Para un sitio de proyecto, normalmente tiene la forma `https://TU-USUARIO.github.io/TU-REPOSITORIO/`. La instalación y la preparación del modo sin conexión se hacen desde ese enlace.

[Guía oficial para configurar la publicación en GitHub Pages](https://docs.github.com/es/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)

## Instalar en el teléfono

- **Android.** Abre el enlace con Chrome y toca **Instalar app** si aparece. También puedes usar el menú de Chrome y elegir **Instalar** o **Agregar a la pantalla principal**, seguido de **Instalar** cuando Chrome ofrezca esa opción. [Ayuda de Chrome](https://support.google.com/chrome/answer/9658361?hl=es&co=GENIE.Platform%3DAndroid)
- **iPhone.** Abre el enlace en Safari, toca **Compartir → Agregar a Inicio**, activa **Abrir como app web** si aparece y confirma con **Agregar**. [Guía de Apple](https://support.apple.com/es-mx/guide/iphone/iphea86e5236/ios)

Abre la app al menos una vez con internet para guardar los archivos. Después, activa el modo avión y abre la calculadora desde su ícono para comprobar el uso sin conexión. Si borraste los datos del sitio en el teléfono, vuelve a abrir la app con internet.

Al publicar cambios en la calculadora, incrementa `cacheVersion` en `sw.js` (esta versión usa `v2`) junto con los archivos actualizados. Abre la app con internet una vez: el navegador descarga la versión nueva, la activa y borra la caché anterior. La siguiente vez que abras la app ya usa los cambios. Si un teléfono sigue mostrando la versión anterior, ciérrala por completo y vuelve a abrirla con internet.

## Verificación

Estas comprobaciones se hicieron en Chrome con la app servida por HTTP, a 320, 360 y 390 px de ancho (también 768 y 1100 px):

- 100 L, 100 000 mL, 98 kg, 98 000 g y 98 000 000 mg (0,98 kg/L), de 14 a 16 °D con ácido láctico al 80 %: 25 g en los cinco casos.
- 10 L, de pH 6,6 a 6,3, factor de 0,2 g/L/pH y pureza de 80 %: 0,75 g.
- Piloto de 10 L, 10 000 mL y 9,8 kg (0,98 kg/L): el mismo factor y una dosis de 20 g.
- Cambio de unidad con densidad, sin densidad (se conservan número y unidad), con densidad inválida o 0, y con la casilla vacía. Con 60 cambios aleatorios de unidad, la dosis sigue en 25 g.
- **Borrar todo** en ambos modos: deja vacías las casillas, quita errores y resultado, y conserva el modo.
- Sin desbordes horizontales en pantallas estrechas. Los campos usan texto de 16 px o más, y los botones y selectores miden al menos 44 px.
- Actualización de una app con la caché `v1` a la `v2` y uso en modo avión, incluida la calculadora, los estilos, los scripts, el manifiesto y los íconos.
