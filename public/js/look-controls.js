import { Vector3, Quaternion, Euler, Object3D } from './three.module.js';
import { DeviceOrientationControls } from './DeviceOrientationControls.js';

const PI_2 = Math.PI / 2;

/**
 * look-controls. Update entity pose, factoring mouse, touch, and W̶e̶b̶V̶R̶  WebXR API data.
 */
class LookControls {
    constructor(object3D, canvas, mouse = true, touch = true, XRMode = false) {
        this.object3D = object3D;
        this._canvas = canvas;

        // Event Listeners:
        this.MouseControl = mouse;
        this.TouchControl = touch;
        this.XRMode = XRMode;

        //Private Properties:
        this._enabled = true;
        this._DeviceOrientationTracking = true;
        this._pointerLock = false;

        //Public Properties:
        this.reverseMouseDrag = false;
        this.reverseTouchDrag = false;

        //Variables:
        // this.deltaYaw = 0;
        this.previousHMDPosition = new Vector3();
        this.hmdQuaternion = new Quaternion();
        this._deviceOrientationAbsoluteEuler = new Euler();
        this._deviceOrientationDeltaEuler = new Euler();
        this.position = new Vector3();

        this.rotation = {};
        this.deltaRotation = {};
        this.hasSavedPose = false;
        this.savedPose = null;

        // Set up states and Object3Ds needed to store rotation data.
        this._mouseDown = false;
        this._mousePitch = new Object3D();
        this._mouseYaw = new Object3D();
        this._mouseYaw.position.y = 10;
        this._mouseYaw.add(this._mousePitch);
        this.previousMouseEvent = {};

        // setupMagicWindowControls();
        this.magicWindowControls = new DeviceOrientationControls(new Object3D());
        this.previousMagicWindowYaw = 0;

        // To save / restore camera pose
        this.savedPose = {
            position: new Vector3(),
            rotation: new Euler()
        };

        // Call enter VR handler if the scene has entered VR before the event listeners attached.
        // if (this.el.sceneEl.is('vr-mode') || this.el.sceneEl.is('ar-mode')) { this.onEnterVR(); }
        // Replaced by XRMode property, which is set by the user when instantiating this class or via setter.
        if(XRMode) this.onEnterVR();
    }

    /* -------------------------------------------------------------------------- */
    /*                                  LifeCicle                                 */
    /* -------------------------------------------------------------------------- */

    /**
     * Update orientation for mobile, mouse drag, and headset.
     * Mouse-drag only enabled if HMD is not active.
     */
    update() {
        if (!this.Enabled) return;

        // In VR or AR mode, THREE is in charge of updating the camera pose.
        if(this.XRMode){
            // With WebXR THREE applies headset pose to the object3D internally.
            return;
        }

        // updateMagicWindowOrientation();
        const magicWindowAbsoluteEuler = this._deviceOrientationAbsoluteEuler;
        // const magicWindowDeltaEuler = this._deviceOrientationDeltaEuler;

        // Calculate magic window HMD (Head-Mounted Display) quaternion. Sensor data.
        if (this.magicWindowControls) {
            this.magicWindowControls.update();
            magicWindowAbsoluteEuler.setFromQuaternion(this.magicWindowControls.object3D.quaternion, 'YXZ');

            if (magicWindowAbsoluteEuler.y !== 0) {
                this.previousMagicWindowYaw = magicWindowAbsoluteEuler.y;
            }
            // if (this.previousMagicWindowYaw) {
                this._deviceOrientationDeltaEuler.x = magicWindowAbsoluteEuler.x;
                this._deviceOrientationDeltaEuler.y += magicWindowAbsoluteEuler.y - this.previousMagicWindowYaw;
                this._deviceOrientationDeltaEuler.z = magicWindowAbsoluteEuler.z;
                this.previousMagicWindowYaw = magicWindowAbsoluteEuler.y;
            //}
        }
        //End of updateMagicWindowOrientation()...
        
        // On mobile, do camera rotation with touch events and sensors.
        this.object3D.rotation.x = this._deviceOrientationDeltaEuler.x + this._mousePitch.rotation.x;
        this.object3D.rotation.y = this._deviceOrientationDeltaEuler.y + this._mouseYaw.rotation.y;
        this.object3D.rotation.z = this._deviceOrientationDeltaEuler.z;
        //End of updateOrientation()...
        console.log(this.object3D.rotation.x, this.object3D.rotation.y, this.object3D.rotation.z);
        console.log(this.magicWindowControls.object3D.rotation.x, this.magicWindowControls.object3D.rotation.y, this.magicWindowControls.object3D.rotation.z);
    }

    /* -------------------------------------------------------------------------- */
    /*                                 Properties                                 */
    /* -------------------------------------------------------------------------- */

    get Enabled() { return this._enabled; }
    set Enabled(value) {
        // Disable grab cursor classes if no longer enabled.
        if (value === false) {
            this.updateGrabCursor(false);
        }
        // Magic windows controls are in sync with this.enabled property
        if (this.magicWindowControls) {
            this.magicWindowControls.enabled = value;
        }
        this._enabled = value;
    }

    get XRMode() { return this._XRMode; }
    set XRMode(value) {
        this._XRMode = value;
        if(this._XRMode){
            this.onEnterVR();
            return;
        }
        this.onExitVR();
    }

    get DeviceOrientationTracking() { return this._DeviceOrientationTracking; }
    set DeviceOrientationTracking(value) {
        // Reset magic window eulers if tracking is disabled.
        this._DeviceOrientationTracking = value;
        if (!this._DeviceOrientationTracking) {
            this._deviceOrientationAbsoluteEuler.set(0, 0, 0);
            this._deviceOrientationDeltaEuler.set(0, 0, 0);
        }
    }

    get TouchControl() { return this._touchControlEnabled; }
    set TouchControl(value) {
        this._touchControlEnabled = value;
        if(!this._canvas) return;

        //La responsabilidad es añadir y/o remover los eventos de touch.
        if(this._touchControlEnabled){
            // Touch events.
            this._canvas.addEventListener('touchstart', this.onTouchStart);
            window.addEventListener('touchmove', this.onTouchMove);
            window.addEventListener('touchend', this.onTouchEnd);
            return;
        }

        // Touch events.
        this._canvas.removeEventListener('touchstart', this.onTouchStart);
        window.removeEventListener('touchmove', this.onTouchMove);
        window.removeEventListener('touchend', this.onTouchEnd);
    }

    get MouseControl() { return this._mouseControlEnabled; }
    set MouseControl(value) {
        this._mouseControlEnabled = value;
        // this.updateGrabCursor(value);
        if(!this._canvas) return;

        //La responsabilidad es añadir y/o remover los eventos de mouse.
        if(this._mouseControlEnabled){
            // Mouse events.
            this._canvas.addEventListener('mousedown', this.onMouseDown, false);
            window.addEventListener('mousemove', this.onMouseMove, false);
            window.addEventListener('mouseup', this.onMouseUp, false);
            return;
        }

        // Mouse events.
        this._canvas.removeEventListener('mousedown', this.onMouseDown);
        window.removeEventListener('mousemove', this.onMouseMove);
        window.removeEventListener('mouseup', this.onMouseUp);
    }

    get PointerLock() { return this._pointerLock; }
    set PointerLock(value) {
        // La responsabilidad del pointer lock es suscribirse a los eventos de pointer lock. Pointer Lock events(Mouse Lock API).
        this._pointerLock = value;
        if(this._pointerlock){
            document.addEventListener('pointerlockchange', this.onPointerLockChange);
            document.addEventListener('mozpointerlockchange', this.onPointerLockChange);
            document.addEventListener('pointerlockerror', this.onPointerLockError);
            return;
        }

        document.removeEventListener('pointerlockchange', this.onPointerLockChange);
        document.removeEventListener('mozpointerlockchange', this.onPointerLockChange);
        document.removeEventListener('pointerlockerror', this.onPointerLockError);
        document.exitPointerLock();
    }

    /**
      * Shows or Hides grabbing cursor.
    */
    set GrabbingCursor(value) {
        //this.el.sceneEl.canvas.style.cursor = 'grabbing';
        if(value){
            //Show grabbing cursor
            this._canvas.classList.add('grabbing-cursor');
        }

        //Hide grabbing cursor
        this._canvas.classList.remove('grabbing-cursor');
    }

    /* -------------------------------------------------------------------------- */
    /*                                   Eventos                                  */
    /* -------------------------------------------------------------------------- */

    /**
     * Register mouse down to detect mouse drag.
     */
    onMouseDown(event) {
        // var sceneEl = this.el.sceneEl;
        // if (!this.data.enabled || !this.data.mouseEnabled || ((sceneEl.is('vr-mode') || sceneEl.is('ar-mode')) && sceneEl.checkHeadsetConnected())) { return; }
        if (!this.enabled || !this.mouseEnabled || this.XRMode) return;
        if (event.button !== 0) return; // Handle only primary button.

        var canvasEl = sceneEl && sceneEl.canvas;

        this._mouseDown = true;
        this.previousMouseEvent.screenX = event.screenX;
        this.previousMouseEvent.screenY = event.screenY;
        this.GrabbingCursor = true;

        if (this.pointerLockEnabled && !this._pointerLock) {
            if (canvasEl.requestPointerLock) {
                canvasEl.requestPointerLock();
            } else if (canvasEl.mozRequestPointerLock) {
                canvasEl.mozRequestPointerLock();
            }
        }
    }

    /**
     * Translate mouse drag into rotation.
     *
     * Dragging up and down rotates the camera around the X-axis (yaw).
     * Dragging left and right rotates the camera around the Y-axis (pitch).
     */
    onMouseMove(event) {
        let direction;
        let movementX;
        let movementY;
        const previousMouseEvent = this.previousMouseEvent;

        // Not dragging or not enabled.
        if (!this.enabled || (!this._mouseDown && !this._pointerLock)) { return; }

        // Calculate delta.
        if (this._pointerLock) {
            movementX = event.movementX || event.mozMovementX || 0;
            movementY = event.movementY || event.mozMovementY || 0;
        } else {
            movementX = event.screenX - previousMouseEvent.screenX;
            movementY = event.screenY - previousMouseEvent.screenY;
        }
        this.previousMouseEvent.screenX = event.screenX;
        this.previousMouseEvent.screenY = event.screenY;

        // Calculate rotation.
        direction = this.reverseMouseDrag ? 1 : -1;
        this._mouseYaw.rotation.y += movementX * 0.002 * direction;
        this._mousePitch.rotation.x += movementY * 0.002 * direction;
        this._mousePitch.rotation.x = Math.max(-PI_2, Math.min(PI_2, this._mousePitch.rotation.x));
    }

    /**
     * Register mouse up to detect release of mouse drag.
     */
    onMouseUp () {
        this._mouseDown = false;
        // this.hideGrabbingCursor();
        this.GrabbingCursor = false;
    }

    /**
     * Register touch down to detect touch drag.
     */
    onTouchStart(event) {
        //if (event.touches.length !== 1 || !this.data.touchEnabled || this.el.sceneEl.is('vr-mode') || this.el.sceneEl.is('ar-mode')) { return; }
        if(event.touches.length !== 1 || !this._touchControlEnabled || this.XRMode) return;

        this.touchStart = {
            x: event.touches[0].pageX,
            y: event.touches[0].pageY
        };
        this.touchStarted = true;
    }

    /**
     * Translate touch move to Y-axis rotation.
     */
    onTouchMove(event) {
        if (!this.touchStarted || !this._touchControlEnabled) return;

        const deltaY = 2 * Math.PI * (event.touches[0].pageX - this.touchStart.x) / this._canvas.clientWidth;
        const direction = this.data.reverseTouchDrag ? 1 : -1;
        
        // Limit touch orientaion to to yaw (y axis).
        this._mouseYaw.rotation.y -= deltaY * 0.5 * direction;
        this.touchStart = {
            x: event.touches[0].pageX,
            y: event.touches[0].pageY
        };
    }

    /**
     * Register touch end to detect release of touch drag.
     */
    onTouchEnd() {
        this.touchStarted = false;
    }

    /**
     * Update Pointer Lock state.
     */
    onPointerLockChange() {
        this._pointerLock = !!(document.pointerLockElement || document.mozPointerLockElement);
    }

    /**
      * Recover from Pointer Lock error.
      */
    onPointerLockError() {
        this._pointerLock = false;
    }

    /**
     * Saves the pose, so it can be restored on exit.
     */
    onEnterVR() {
        // var sceneEl = this.el.sceneEl;
        // if (!sceneEl.checkHeadsetConnected()) { return; }
        /**
         * Save camera pose before entering VR to restore later if exiting.
         */
        // this.saveCameraPose();
        // saveCameraPose() {
        this.savedPose.position.copy(this.object3D.position);
        this.savedPose.rotation.copy(this.object3D.rotation);
        this.hasSavedPose = true;
        // }
        this.object3D.position.set(0, 0, 0);
        this.object3D.rotation.set(0, 0, 0);
        // if (sceneEl.hasWebXR) {
        //     this.object3D.matrixAutoUpdate = false;
        //     this.object3D.updateMatrix();
        // }
    }

    /**
     * Restore the previous pose.
     */
    onExitVR() {
        // if (!this.el.sceneEl.checkHeadsetConnected()) { return; }
        /**
         * Reset camera pose to before entering VR.
        */
        // this.restoreCameraPose();
        // restoreCameraPose() {
        if (!this.hasSavedPose) { return; }
        // Reset camera orientation.
        this.object3D.position.copy(this.savedPose.position);
        this.object3D.rotation.copy(this.savedPose.rotation);
        this.hasSavedPose = false;
        // }
        this.previousHMDPosition.set(0, 0, 0);
        this.object3D.matrixAutoUpdate = true;
    }
}

export { LookControls };
