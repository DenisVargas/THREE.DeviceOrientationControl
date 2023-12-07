import { Object3D, MathUtils, Quaternion, Vector3, Euler } from "./three.module.js";
/**
 * @author richt / http://richt.me
 * @author WestLangley / http://github.com/WestLangley
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

        this.q1 = new Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5));
        this.zee = new Vector3(0, 0, 1);

        /**
         * @type {DeviceOrientationEvent} - Objeto que contiene información sobre la orientación del dispositivo.
         */
        this.deviceOrientation = {
            alpha: null,
            beta: null,
            gamma: null
        };
        /**
         * @type {number} - Screen orientation stored in radians.
         */
        this.screenOrientation = 0;

        // Inside onScreen_OrientationChange() we are supposed to use window.orientation values but is now deprecated. {@link https://developer.mozilla.org/en-US/docs/Web/API/Screen/orientation}
        // we use Screen.orientation.type instead, available on the window.screen property {@link https://developer.mozilla.org/en-US/docs/Web/API/Window/screen}.
        // this.screenOrientation = window.orientation || 0; //Deprecated
        //Translation from window.orientation => screen.orientation API values
        this.windowOrientation_map = {
            'portrait-primary': 0,
            'portrait-secondary': 0,
            'landscape-primary': MathUtils.degToRad(90),
            'landscape-secondary': MathUtils.degToRad(-90),
            270: MathUtils.degToRad(-90),
            90: MathUtils.degToRad(90),
            0: 0,
            null: 0,
            undefined: 0
        };

        this._alphaOffsetAngle = 0;
        this._betaOffsetAngle = 0;
        this._gammaOffsetAngle = 0;

        this.debug = {
            source_screenOrientation: { type: null, angle: null},
            device_inputs: { alpha: null, beta: null, gamma: null },
            computed_euler: new Euler(),
        };

        this.update();
    }

    get AlphaOffsetAngle() {
        return this._alphaOffsetAngle;
    }
    set AlphaOffsetAngle(angle) {
        this._alphaOffsetAngle = angle;
        this.update();
    }
    get BetaOffsetAngle() {
        return this._betaOffsetAngle;
    }
    set BetaOffsetAngle(angle) {
        this._betaOffsetAngle = angle;
        this.update();
    }
    get GammaOffsetAngle() {
        return this._gammaOffsetAngle;
    }
    set GammaOffsetAngle(angle) {
        this._gammaOffsetAngle = angle;
        this.update();
    }

    update() {
        // console.log("DeviceOrientationControls::update()");
        if (this.enabled === false) return;

        const alpha = this.deviceOrientation.alpha ? this.deviceOrientation.alpha + this._alphaOffsetAngle : 0; // Z
        const beta  = this.deviceOrientation.beta  ? this.deviceOrientation.beta  + this._betaOffsetAngle  : 0; // X'
        const gamma = this.deviceOrientation.gamma ? this.deviceOrientation.gamma + this._gammaOffsetAngle : 0; // Y''

        const computed_euler = new Euler();
        computed_euler.set(beta, alpha, -gamma, 'YXZ');
        this.debug.computed_euler = computed_euler;

        this.setObjectQuaternion(
            computed_euler,
            this.screenOrientation
        );
    }

    /* -------------------------------------------------------------------------- */
    /*                                   Eventos                                  */
    /* -------------------------------------------------------------------------- */

    /**
     * Maneja el evento de cambio en la orientación del dispositivo.
     * @param {Event} event - Objeto de tipo Event que contiene información sobre el evento.
     */
    onDevice_OrientationChange(event){
        console.log("DeviceOrientationControls::DeviceOrientationChangeEvent::90");
        console.log(event);
        this.debug.device_inputs = { alpha: event.alpha, beta: event.beta, gamma: event.gamma };
        this.deviceOrientation = {
            alpha: (MathUtils.degToRad(event.alpha)).toFixed(6),
            beta: (MathUtils.degToRad(event.beta)).toFixed(6),
            gamma: (MathUtils.degToRad(event.gamma)).toFixed(6)
        };
    };
    /**
     * Maneja el evento de cambio en la orientación de la pantalla.
     * @param {Event} event - Objeto de tipo Event que contiene información sobre el evento.
     */
    onScreen_OrientationChange(event){
        console.info(`The orientation event is of type ${event.type}`);
        //Podemos identificar el tipo de evento que se ha disparado usando el atributo type del objeto event

        if(event.type === "change"){
            //El evento es de tipo change targetea a screen.orientation por lo que utilizamos screen.orientation.angle para obtener el valor del ángulo de la orientación.

            // Podemos acceder a estos valores utilizando event.target.type y event.target.angle
            // Necesitamos hacer una pequeña conversion para que equivalga a los valores de window.orientation
            this.screenOrientation = this.windowOrientation_map[event.target.angle];
            //this.screenOrientation = this.windowOrientation_map[event.target.type]; //Alternativa usando strings.

            // console.log(screen.orientation);
            // console.log(screen.orientation.type);
            // console.log(screen.orientation.angle);

            this.debug.source_screenOrientation = { type: screen.orientation.type, angle: screen.orientation.angle };
            return;
        }

        if(event.type === "orientationchange"){
            //El evento es de tipo orientationchange targetea a window por lo que utilizamos window.orientation para obtener el valor de la orientación.
            if(window.orientation){
                //Esta propiedad está deprecada y no debería usarse. Todavia funciona en Firefox.
                this.screenOrientation = window.orientation === 0 ? 0 : MathUtils.degToRad(window.orientation);
                this.debug.source_screenOrientation = { type: screen.orientation.type, angle: screen.orientation.angle };
                return;
            }

            if(window.orientation === undefined){
                //window.orientation no está soportado por el navegador.
                console.warn("window.orientation is not supported by this browser.");

                //Probamos acceder a screen.orientation.angle
                if(screen.orientation.angle){
                    //Necesitamos hacer una pequeña conversion para que equivalga a los valores de window.orientation
                    this.screenOrientation = this.windowOrientation_map[screen.orientation.angle];
                    //this.screenOrientation = this.windowOrientation_map[screen.orientation.type]; //Alternativa usando strings.
                    return;
                }
            }
        }

        //Fallback if all else fails
        this.screenOrientation = 0;
    };

    /* -------------------------------------------------------------------------- */
    /*                             Metodos Auxiliares                             */
    /* -------------------------------------------------------------------------- */

    /**
     * Método para establecer un quaternion en base a valores de ángulos y orientación.
     * @param {Euler} euler - Instancia de THREE.Euler que contiene los valores alpha, beta y gamma procesados.
     * @param {number} orient - Orientación.
     */
    setObjectQuaternion(euler, orient){
        const q0 = new Quaternion();
        q0.setFromAxisAngle(this.zee, -orient);
        this.object3D.quaternion.setFromEuler(euler);
        this.object3D.quaternion.multiply(this.q1);
        this.object3D.quaternion.multiply(q0);
    };
}

// Usage:
// const controls = new DeviceOrientationControls(AnObject3DInstance);