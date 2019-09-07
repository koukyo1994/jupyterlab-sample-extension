import {
  Message
} from '@phosphor/messaging';

import {
  JupyterFrontEnd, JupyterFrontEndPlugin
} from '@jupyterlab/application';

import {
  ICommandPalette, MainAreaWidget
} from '@jupyterlab/apputils';

import {
  Widget
} from '@phosphor/widgets';

class APODWidget extends Widget {
  /**
   * Construct a new Apod widget.
   */
  constructor() {
    super();

    this.addClass('my-apodWidget');


    // Add an image element to the panel
    this.img = document.createElement('img');
    this.node.appendChild(this.img);

    this.summary = document.createElement('p');
    this.node.appendChild(this.summary);
  }

  /**
   * The image element associated with the widget
   */
  readonly img: HTMLImageElement;

  /**
   * The summary text element associiated with the widget
   */
  readonly summary: HTMLParagraphElement;

  /**
   * Handle update requests for the widget
   */
  async onUpdateRequest(msg: Message): Promise<void> {
    const responce = await fetch(
      `https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY&date=${this.randomDate()}`);

    if (!responce.ok) {
      const data = await responce.json();
      if (data.error) {
        this.summary.innerText = data.error.message;
      } else {
        this.summary.innerText = responce.statusText;
      }
      return;
    }

    const data = await responce.json() as APODResponce;

    if (data.media_type === 'image') {
      // Populate the image
      this.img.src = data.url;
      this.img.title = data.title;
      this.summary.innerText = data.title;
      if (data.copyright) {
        this.summary.innerText += ` (Copyright ${data.copyright})`;
      }
    } else {
      this.summary.innerText = 'Random APOD feetched was not an image.'
    }
  }

  randomDate() {
    const start = new Date(2010, 1, 1);
    const end = new Date();
    const randomDate = new Date(
      start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    return randomDate.toISOString().slice(0, 10);
  }
}

interface APODResponce {
  copyright: string;
  date: string;
  explanation: string;
  media_type: 'video' | 'image';
  title: string;
  url: string;
}

/**
 * Activate the APOD Widget extension.
 */
function activate(app: JupyterFrontEnd, palette: ICommandPalette) {
  console.log('JupyterLab extension jupyterlab_apod is activated!');

  // Create a single widget.
  const content = new APODWidget();
  const widget = new MainAreaWidget({ content });
  widget.id = 'apod-jupyterlab';
  widget.title.label = 'Astronomy Picture';
  widget.title.closable = true;

  // Add an application command
  const command: string = 'apod:open';
  app.commands.addCommand(command, {
    label: 'Random Astronomy Picture',
    execute: () => {
      if (!widget.isAttached) {
        // Attach the widget to the main area if it's not there
        app.shell.add(widget, 'main');
      }
      // Refresh the picture in the widget
      content.update();
      // Activate the widget
      app.shell.activateById(widget.id);
    }
  });

  // Add the command to the palette
  palette.addItem({ command, category: 'Tutorial' });
}

/**
 * Initialization data for the jupyterlab-apod extension.
 */
const extension: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab-apod',
  autoStart: true,
  requires: [ICommandPalette],
  activate: activate
};

export default extension;
