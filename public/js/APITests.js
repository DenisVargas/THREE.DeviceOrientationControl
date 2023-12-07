class APITest_UI {
    constructor() {
        //Buscar referencias al id="windowOrientationSupport" y  screenOrientationSupport
        this.wOElement = document.getElementById("windowOrientationSupport");
        this.sOElement = document.getElementById("screenOrientationSupport");
        this.wDOEElement = document.getElementById("windowDeviceOrientationEventSupport");
        this.SOTypeText = document.getElementById("SOType");
        this.SOAngle = document.getElementById("SOAngle");

        this.wOSupport = window.orientation ? true : false;
        this.styleAs(this.wOElement, this.wOSupport);
        console.warn("window.orientation is deprecated. Use screen.orientation instead.");

        //Testear si hay acceso a la API de screen.Orientation
        this.sOSupport = screen.orientation || screen.onorientationchange ? true : false;
        this.styleAs(this.sOElement, this.sOSupport);

        //Testear si hay acceso a la API de windowOrientationSupport
        this.wDOESupport = window.DeviceOrientationEvent ? true : false;
        this.styleAs(this.wDOEElement, this.wDOESupport);

        
    }

    onChange(event){
        const type = event.target.type;
        const angle = event.target.angle;
        console.log(`ScreenOrientation change: ${type}, ${angle} degrees.`);
        this.SOTypeText.innerText = type;
        this.SOAngle.innerText = angle;
    }

    styleAs(element, support) {
        if (support) {
            element.innerText = "Supported";
            element.classList.add("supported");
            element.classList.remove("deprecated");
        }
        else {
            element.innerText = "Not Supported";
            element.classList.add("deprecated");
            element.classList.remove("supported");
        }
    }
}

export { APITest_UI };