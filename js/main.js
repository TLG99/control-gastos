// js/main.js
// Punto de entrada — arranca el observer de autenticación

import { initAuth } from "./auth.js";
import { initDialogs } from "./dialogs.js";
import { initTheme } from "./theme.js";

initDialogs();
initTheme();
initAuth();
