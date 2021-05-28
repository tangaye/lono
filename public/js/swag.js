const HideInfoUrlPartsPlugin = () => {
  return {
    wrapComponents: {
      InfoUrl: () => () => null
    }
  }
}
window.onload = function () {
    // Begin Swagger UI call region
    const ui = SwaggerUIBundle({
      url: "/lono.json",
      dom_id: "#swagger-ui",
      deepLinking: false,
      presets: [SwaggerUIBundle.presets.apis,
        ],
      plugins: [HideInfoUrlPartsPlugin],
      // layout: "StandaloneLayout",
    });
    // End Swagger UI call region

    window.ui = ui;
  };