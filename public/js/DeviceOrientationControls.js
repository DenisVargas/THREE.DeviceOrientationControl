import { Object3D, MathUtils, Quaternion, Vector3, Euler } from "./three.module.js";

const q1 = new Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5)); // - PI/2 (90 degrees) around the x-axis
const zee = new Vector3(0, 0, 1);

// Inside onScreen_OrientationChange() we are supposed to use window.orientation values, but it is now deprecated. {@link https://developer.mozilla.org/en-US/docs/Web/API/Screen/orientation}
// Screen.orientation.type is used instead, available on the window.screen property {@link https://developer.mozilla.org/en-US/docs/Web/API/Window/screen}.
const windowOrientation_map = {
    270: MathUtils.degToRad(-90),
    '-90': MathUtils.degToRad(-90),
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
        this._enabled = true;

        /**
         * @type {DeviceOrientationEvent} - Objeto que contiene información sobre la orientación del dispositivo.
         * @property {number} alpha - Valor predeterminado para alpha (0 por defecto).
         * @property {number} beta - Valor predeterminado para beta (0 por defecto).
         * @property {number} gamma - Valor predeterminado para gamma (0 por defecto).
         * @see https://developer.mozilla.org/en-US/docs/Web/API/DeviceOrientationEvent
         */
        this.device = {
            alpha: 0,
            beta: 0,
            gamma: 0
        };
        /**
         * @type {number} - Screen orientation stored in radians.
         */
        this.screenOrientation = 0;

        // this.debug = {
        //     _source_screenOrientation: { type: null, angle: null },
        //     _device_inputs: { alpha: 0, beta: 0, gamma: 0 },
        //     _src_deviceOrientation: new Euler(),
        // };

        // Añadir eventos
        // window.addEventListener('orientationchange', this.onScreen_OrientationChange);
        // screen.orientation.addEventListener('change', this.onScreen_OrientationChange);
        //screen.orientation.onchange = this.onScreen_OrientationChange;
        //screen.orientation.addEventListener('change', this.onScreen_OrientationChange);
        window.addEventListener('orientationchange', (event) => this.onScreen_OrientationChange(event));

        //Must externally ask for support on IOs 13+ devices using enabled property.

        this.update();
    }

    get enabled() { this._enabled; }
    set enabled(value) { 
        this._enabled = value; 
        if(this._enabled){
            //Subscribe to 
            this._deviceOrientationHandler = (event) => { this.onDevice_OrientationChange(event) };
            window.addEventListener('deviceorientation', this._deviceOrientationHandler);
            return;
        }
        //Unsubscribe
        window.removeEventListener('deviceorientation', this._deviceOrientationHandler);
        //Maybe we should reset the device object?
    }

    update() {
        // console.log("DeviceOrientationControls::update()");
        if (this._enabled === false) return;

        // const alpha = this.deviceOrientation.alpha ? this.deviceOrientation.alpha + this._alphaOffsetAngle : 0; // Z
        // const beta  = this.deviceOrientation.beta  ? this.deviceOrientation.beta  + this._betaOffsetAngle  : 0; // X'
        // const gamma = this.deviceOrientation.gamma ? this.deviceOrientation.gamma + this._gammaOffsetAngle : 0; // Y''

        const _deviceOrientation = new Euler();
        _deviceOrientation.set(this.device.beta, this.device.alpha, -this.device.gamma, 'YXZ'); // 'ZXY' for the device, but 'YXZ' for us
        // this.debug._src_deviceOrientation = _deviceOrientation;

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
     * Maneja el evento de cambio en la orientación de la pantalla.
     * @param {Event} event - Objeto de tipo Event que contiene información sobre el evento.
     */
    onScreen_OrientationChange(event) {
        console.info(`The orientation event is of type ${event.type}`);
        // Podemos identificar el tipo de evento que se ha disparado usando el atributo type del objeto event

        if(screen.orientation){
            const orientation = screen.orientation;
            this.screenOrientation = windowOrientation_map[orientation.angle];
            console.log(`Inputs are: ${orientation.angle} degrees. Result is ${this.screenOrientation} radians.`);
            return;
        }

        //Fallback
        this.screenOrientation = 0;
        console.log(`Screen orientation is ${this.screenOrientation} radians.`);
    }
    /**
     * Maneja el evento de cambio en la orientación del dispositivo.
     * @param {Event} event - Objeto de tipo Event que contiene información sobre el evento.
     */
    onDevice_OrientationChange(event) {
        if(event.alpha === null || event.beta === null || event.gamma === null) { 
            this.device = { alpha: 0, beta: 0, gamma: 0 };
            return;
        }

        this.device.alpha = MathUtils.degToRad(event.alpha); // Z
        this.device.beta  = MathUtils.degToRad(event.beta) ; // X'
        this.device.gamma = MathUtils.degToRad(event.gamma); // Y''
    }
}
