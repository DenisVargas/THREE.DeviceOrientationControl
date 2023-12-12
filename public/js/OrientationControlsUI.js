import { DeviceOrientationControls } from "./DeviceOrientationControls.js";

class OrientationControlsUI {
    constructor(mountElement){
        /**
         * @type {DeviceOrientationControls} deviceOrientationControlObject
         */
        this._deviceOrientationControlObject = null;

        this.root = mountElement;
        let htmlString = `
            <div id="device-orientation-values">
                <h1>Orientation Values</h1>
                <p>alpha: <span id="alpha"></span>0</p>
                <p>beta: <span id="beta"></span>0</p>
                <p>gamma: <span id="gamma"></span>0</p>
                <p>orientation value: <span id="orientation-value">0</span></p>
            </div>
            <div id="device-orientation-control-values">
                <p>Screen Orientation Type: <span id="screen-orientation-type">portrait-primary</span></p>
                <p>Screen Orientation Angle: <span id="screen-orientation-angle">0</span></p>
                <p>alphaOffsetAngle: <span id="alphaOffsetAngle">0</span></p>
                <p>betaOffsetAngle: <span id="betaOffsetAngle">0</span></p>
                <p>gammaOffsetAngle: <span id="gammaOffsetAngle">0</span></p>
            </div>
        `;
        //Instanciamos los elementos del DOM
        this.root.insertAdjacentHTML("beforeend", htmlString);

        /* --------------------------------- Panels --------------------------------- */
        this.deviceOrientationValuesElement = document.getElementById("device-orientation-values");
        this.deviceOrientationControlValuesElement = document.getElementById("device-orientation-control-values");
        //console.log(this.deviceOrientationControlValuesElement);

        /* --------------------------------- Values --------------------------------- */
        this.alphaElement = document.getElementById("alpha");
        this.betaElement = document.getElementById("beta");
        this.gammaElement = document.getElementById("gamma");
        this.orientationValueElement = document.getElementById("orientation-value");

        this.screenOrientationTypeElement = document.getElementById("screen-orientation-type");
        this.screenOrientationAngleElement = document.getElementById("screen-orientation-angle");
        this.alphaOffsetAngleElement = document.getElementById("alphaOffsetAngle");
        this.betaOffsetAngleElement = document.getElementById("betaOffsetAngle");
        this.gammaOffsetAngleElement = document.getElementById("gammaOffsetAngle");
    }

    set deviceOrientationControlObject(value) {
        this._deviceOrientationControlObject = value;
        this.update(); //Update initial values.
        console.log("DEBUG_UI_DeviceOrientationControls_Tests::deviceOrientationControlObject:: Has been setted");
    }

    update() {
        if(!this._deviceOrientationControlObject) {
            console.warn("DeviceOrientationControls_Tests::updateDebugValues:: No deviceOrientationControlObject has been setted");
            //Ocultamos el panel deviceOrientationControlValuesElement añadiendo la clase hidden
            this.deviceOrientationControlValuesElement.classList.add("hidden");
            return;
        }

        //Mostramos el panel deviceOrientationControlValuesElement quitando la clase hidden
        this.deviceOrientationControlValuesElement.classList.remove("hidden");

        // this.alphaElement.innerText = this._deviceOrientationControlObject.debug..alpha;
        this.alphaElement.innerText = this._deviceOrientationControlObject.deviceOrientation?.alpha;
        this.betaElement.innerText = this._deviceOrientationControlObject.deviceOrientation?.beta;
        this.gammaElement.innerText = this._deviceOrientationControlObject.deviceOrientation?.gamma;
        this.orientationValueElement.innerText = this._deviceOrientationControlObject.screenOrientation;

        //Actualizamos el screen Orientation:
        const debugSRC_screenOrientation = this._deviceOrientationControlObject.debug._source_screenOrientation;
        this.screenOrientationTypeElement.innerText = debugSRC_screenOrientation.type ? debugSRC_screenOrientation.type : "portrait-primary";
        this.screenOrientationAngleElement.innerText = debugSRC_screenOrientation.angle ? debugSRC_screenOrientation.angle : 0;

        //Actualizamos los offsets
        this.alphaOffsetAngleElement.innerText = this._deviceOrientationControlObject.AlphaOffsetAngle;
        this.betaOffsetAngleElement.innerText = this._deviceOrientationControlObject.BetaOffsetAngle;
        this.gammaOffsetAngleElement.innerText = this._deviceOrientationControlObject.GammaOffsetAngle;
    }
}

export { OrientationControlsUI };
