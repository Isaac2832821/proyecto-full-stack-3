# colegio-ui-components

Este es un **componente frontend empaquetado como NPM** requerido para la entrega del proyecto.

Contiene componentes UI reutilizables (como `ButtonColegio`) diseñados específicamente para el ecosistema del colegio.

## Instalación

En tu proyecto React principal (o en la carpeta `frontend`), puedes instalar esta librería localmente usando:

```bash
npm install ../componente-npm
```

## Uso

```jsx
import React from 'react';
import { ButtonColegio } from 'colegio-ui-components';

function App() {
  return (
    <div>
      <ButtonColegio variant="primary" onClick={() => alert('¡Click!')}>
        Guardar
      </ButtonColegio>
    </div>
  );
}
```
