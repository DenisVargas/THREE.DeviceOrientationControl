import { Object3D, MathUtils, Quaternion, Vector3, Euler } from "./three.module.js";

const q1 = new Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5)); // - PI/2 (90 degrees) around the x-axis
const zee = new Vector3(0, 0, 1);

// Inside onScreen_OrientationChange() we are supposed to use window.orientation values, but it is now deprecated. {@link https://developer.mozilla.org/en-US/docs/Web/API/Screen/orientation}
// Screen.orientation.type is used instead, available on the window.screen property {@link https://developer.mozilla.org/en-US/docs/Web/API/Window/screen}.
const windowOrientation_map = {
    270: MathUtils.degToRad(-90),
    90: MathUtils.degToRad(90),
    0: 0,
    null: 0,
    undefined: 0
};

/**
 * @author richt / http://richt.me
 * @author WestLangley / http://github.com/WestLangley
 * @author DenisVargas
 *
 * W3C Device Orientation control (http://w3c.github.io/deviceorientation/spec-source-orientation.html)
 */
export class DeviceOrientationControls {
    /**
     * Clase para controlar la orientación del dispositivo.
     * @param {Object3D} object3D - Instancia de THREE.Object3D a controlar.
     */
    constructor(object3D) {
        this.object3D = object3D;
        this.object3D.rotation.reorder("YXZ");
        this.enabled = true;

        /**
         * @type {DeviceOrientationEvent} - Objeto que contiene información sobre la orientación del dispositivo.
         * @property {number} alpha - Valor predeterminado para alpha (0 por defecto).
         * @property {number} beta - Valor predeterminado para beta (0 por defecto).
         * @property {number} gamma - Valor predeterminado para gamma (0 por defecto).
         * @see https://developer.mozilla.org/en-US/docs/Web/API/DeviceOrientationEvent
         */
        this.deviceOrientation = {
            alpha: 0,
            beta: 0,
            gamma: 0
        };
        /**
         * @type {number} - Screen orientation stored in radians.
         */
        this.screenOrientation = 0;

        this.debug = {
            source_screenOrientation: { type: null, angle: null },
            device_inputs: { alpha: null, beta: null, gamma: null },
            _src_deviceOrientation: new Euler(),
        };

        // Añadir eventos
        screen.orientation.addEventListener('change', this.onScreen_OrientationChange);
        window.addEventListener('orientationchange', this.onScreen_OrientationChange);
        window.addEventListener('deviceorientation', this.onDevice_OrientationChange);

        this.update();
    }

    update() {
        // console.log("DeviceOrientationControls::update()");
        if (this.enabled === false) return;

        // const alpha = this.deviceOrientation.alpha ? this.deviceOrientation.alpha + this._alphaOffsetAngle : 0; // Z
        // const beta  = this.deviceOrientation.beta  ? this.deviceOrientation.beta  + this._betaOffsetAngle  : 0; // X'
        // const gamma = this.deviceOrientation.gamma ? this.deviceOrientation.gamma + this._gammaOffsetAngle : 0; // Y''

        const _deviceOrientation = new Euler();
        _deviceOrientation.set(this.deviceOrientation.beta, this.deviceOrientation.alpha, -this.deviceOrientation.gamma, 'YXZ'); // 'ZXY' for the device, but 'YXZ' for us
        this.debug._src_deviceOrientation = _deviceOrientation;

        const q0 = new Quaternion();
        q0.setFromAxisAngle(zee, -this.screenOrientation);
        this.object3D.quaternion.setFromEuler(_deviceOrientation);
        this.object3D.quaternion.multiply(q1);
        this.object3D.quaternion.multiply(q0);
    }

    /* -------------------------------------------------------------------------- */
    /*                                   Eventos                                  */
    /* -------------------------------------------------------------------------- */

    /**
     * Maneja el evento de cambio en la orientación del dispositivo.
     * @param {Event} event - Objeto de tipo Event que contiene información sobre el evento.
     */
    onDevice_OrientationChange(event) {
        console.log("DeviceOrientationControls::DeviceOrientationChangeEvent::90");
        // console.log(event);
        this.debug.device_inputs = { alpha: event.alpha, beta: event.beta, gamma: event.gamma };
        this.deviceOrientation = {
            alpha: (MathUtils.degToRad(event.alpha)).toFixed(6),
            beta: (MathUtils.degToRad(event.beta)).toFixed(6),
            gamma: (MathUtils.degToRad(event.gamma)).toFixed(6)
        };
    }
    /**
     * Maneja el evento de cambio en la orientación de la pantalla.
     * @param {Event} event - Objeto de tipo Event que contiene información sobre el evento.
     */
    onScreen_OrientationChange(event) {
        console.info(`The orientation event is of type ${event.type}`);
        // Podemos identificar el tipo de evento que se ha disparado usando el atributo type del objeto event

        if (event.type === "change") {
            //El evento es de tipo change targetea a screen.orientation por lo que utilizamos screen.orientation.angle para obtener el valor del ángulo de la orientación.

            // Podemos acceder a estos valores utilizando event.target.type y event.target.angle
            // Necesitamos hacer una pequeña conversion para que equivalga a los valores de window.orientation
            this.screenOrientation = windowOrientation_map[event.target.angle];
            //this.screenOrientation = windowOrientation_map[event.target.type]; //Alternativa usando strings.

            // console.log(screen.orientation);
            // console.log(screen.orientation.type);
            // console.log(screen.orientation.angle);

            this.debug.source_screenOrientation = { type: screen.orientation.type, angle: screen.orientation.angle };
            return;
        }

        // orientationchange { 
        //     isTrusted: true,
        //     eventPhase: 2,
        //     bubbles: false,
        //     cancelable: false,
        //     returnValue: true,
        //     defaultPrevented: false,
        //     composed: false,
        //     currentTarget: null,
        //     detail: null
        //     eventPhase: 0
        //     explicitOriginalTarget: Window http://localhost:3100/
        //     originalTarget: Window http://localhost:3100/
        //     srcElement: Window http://localhost:3100/
        //     target: Window http://localhost:3100/
        //     timeStamp: 1088374
        //     type: "orientationchange"
        //     … 
        // }

        if (event.type === "orientationchange") {
            //El evento es de tipo orientationchange targetea a window por lo que utilizamos window.orientation para obtener el valor de la orientación.
            if (window.orientation) {
                //Esta propiedad está deprecada y no debería usarse. Todavia funciona en Firefox.
                this.screenOrientation = window.orientation === 0 ? 0 : MathUtils.degToRad(window.orientation);
                this.debug.source_screenOrientation = { type: screen.orientation.type, angle: screen.orientation.angle };
                return;
            }

            if (window.orientation === undefined) {
                //window.orientation no está soportado por el navegador.
                console.warn("window.orientation is not supported by this browser.");

                //Probamos acceder a screen.orientation.angle
                if (screen.orientation.angle) {
                    //Necesitamos hacer una pequeña conversion para que equivalga a los valores de window.orientation
                    this.screenOrientation = windowOrientation_map[screen.orientation.angle];
                    //this.screenOrientation = windowOrientation_map[screen.orientation.type]; //Alternativa usando strings.
                    return;
                }
            }
        }

        //Fallback if all else fails
        this.screenOrientation = 0;
    }
}
