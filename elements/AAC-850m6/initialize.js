// Initialize — corre una sola vez
function(instance, context) {
  // 1. Div contenedor que ocupará todo el elemento
  const root = document.createElement("div");
  root.style.height = "100%";
  root.style.width = "100%";
  instance.canvas.appendChild(root);

  // 2. Cargar editor cuando las libs estén listas
  const wait = () => (window.BlockNote && window.Y && window.Y.WebsocketProvider)
                  ? Promise.resolve() : new Promise(r => setTimeout(() => r(wait()), 50));

  wait().then(() => {
    // 3. Yjs provider  (antes usábamos demos.yjs.dev)
const doc = new Y.Doc();

const provider = new Y.WebsocketProvider(
  "wss://free.blr2.piesocket.com/v3",   // base PieSocket
  properties.document_id || "1",        // “1” es el channel_id por defecto
  doc,
  {
    /* los params se añaden como query-string automáticamente */
    params: {
      api_key: "4yn77E9zUO31vzW9fSgn6y66C96vpaZRYPJXO72l",
      notify_self: 1                       // eco local opcional
    }
  }
);


    // 4. BlockNote con colaboración
    const editor = BlockNote.createReactEditor({
      domElement: root,
      document: instance.data.initial || null,
      collaboration: {
        provider,
        fragment: doc.getXmlFragment("document-store"),
        user: { name: context.currentUser?.name || "Invitado", color: "#"+(~~(Math.random()*0xffffff)).toString(16) }
      },
      schema: instance.data.schema // definido más abajo
    });

    instance.data.editor = editor;

    // 5. Escuchar cambios para exponer estado/evento
    editor.on("change", () => {
      const json = JSON.stringify(editor.document);
      instance.publishState("value", json);
      instance.triggerEvent("content_changed");
    });
  });
}

// Update — se llama cuando cambian properties
function(instance, properties) {
  if (instance.data.editor && properties.document_id !== instance.data.room) {
     instance.data.editor.destroy();
     instance.data.room = properties.document_id;
     instance.triggerEvent("reinitialize");
  }
}

// Destroy
function(instance) {
  instance.data.editor?.destroy();
  instance.data.provider?.destroy();
}
