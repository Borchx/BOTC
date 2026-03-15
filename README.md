# 🕰️ Blood on the Clocktower — Web App

Aplicación web para jugar **Blood on the Clocktower** desde el móvil, sin servidor ni instalación.

## ✨ Funcionalidades

- **Grimorio del Narrador** — gestión visual de todos los jugadores con tokens
- **QR por jugador** — cada jugador escanea su QR y ve su rol en secreto en su propio móvil
- **Orden de noche interactivo** — guía paso a paso con habilidades de cada rol
- **3 ediciones completas**: Trouble Brewing, Bad Moon Rising, Sects & Violets
- **Editor de scripts personalizados** — mezcla roles de todas las ediciones + exportar/importar JSON
- **Registro de partida** — log automático de muertes, ejecuciones, cambios de fase y notas manuales
- **Estado persistente** — la partida se guarda automáticamente en localStorage
- **Sin backend** — funciona directamente desde GitHub Pages

## 🚀 Despliegue en GitHub Pages

```bash
# 1. Clona / sube a tu repositorio
git init
git add .
git commit -m "feat: Blood on the Clocktower app"
git remote add origin https://github.com/TU_USUARIO/botc-app.git
git push -u origin main

# 2. En GitHub → Settings → Pages → Source: main / (root)
# 3. URL resultante: https://TU_USUARIO.github.io/botc-app/
```

## 📱 Cómo jugar

### El Narrador (Storyteller)
1. Abre `index.html` en tu móvil
2. **Setup**: añade los nombres de los jugadores, selecciona edición y roles
3. Pulsa **Comenzar partida** — los roles se asignan aleatoriamente
4. En el **Grimorio**, pulsa en cada jugador → **Ver QR**
5. El jugador escanea el QR con su móvil → ve su rol en secreto

### Los Jugadores
1. Escanean el QR que les muestra el Narrador
2. Pulsan **Revelar mi rol** asegurándose de que nadie mire
3. Ven su rol, habilidad, equipo y (si son malignos) sus aliados

## 📁 Estructura

```
botc/
├── index.html          # App del Narrador
├── player.html         # Vista del jugador (QR destino)
├── src/
│   └── data/
│       ├── roles.js    # Todos los roles de las 3 ediciones
│       └── gameState.js # Estado del juego + acciones
└── README.md
```

## 🎮 Roles incluidos

| Edición | Aldeanos | Forasteros | Secuaces | Demonios |
|---------|----------|------------|----------|----------|
| Trouble Brewing | 13 | 4 | 4 | 1 |
| Bad Moon Rising | 13 | 4 | 4 | 4 |
| Sects & Violets | 13 | 4 | 4 | 4 |

## ⚠️ Notas

- Los QR contienen el rol codificado en Base64 — **no son seguros para información sensible**, pero son suficientes para el juego
- El estado se guarda en `localStorage` del dispositivo del Narrador
- Para que los jugadores puedan ver el grimorio actualizado en su pantalla de rol, deben estar en la **misma red local** o el Narrador puede regenerar el QR en cada momento

## 🛠️ Añadir roles personalizados

Edita `src/data/roles.js` y añade un objeto al array `ROLES`:

```js
{
  id: 'mi_rol',          // único
  edition: 'CUSTOM',
  team: 'TOWNSFOLK',     // TOWNSFOLK | OUTSIDER | MINION | DEMON
  name: 'Mi Rol',
  icon: '🎯',
  ability: 'Descripción de la habilidad.',
  firstNight: 5,         // 0 = no actúa en primera noche
  otherNight: 3          // 0 = no actúa en otras noches
}
```

---

*Fan-made project. Blood on the Clocktower es propiedad de The Pandemonium Institute.*
