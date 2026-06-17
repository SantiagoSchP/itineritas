#!/bin/bash
# build.sh
# Este script lo ejecuta Netlify automaticamente antes de publicar el sitio.
# Toma la variable de entorno GEMINI_KEY (configurada en Netlify) y genera
# el archivo config.js con esa clave, para que la app pueda usarla.
# Este archivo config.js generado NUNCA queda guardado en GitHub: se crea
# de nuevo en cada despliegue, solo dentro de Netlify.

echo "window.ITINERITAS_CONFIG = { GEMINI_KEY: '$GEMINI_KEY' };" > config.js
echo "config.js generado correctamente."
