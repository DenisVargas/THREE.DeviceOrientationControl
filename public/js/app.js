import { WebGLRenderer, PerspectiveCamera, Scene, BoxGeometry, MeshBasicMaterial, Mesh, AmbientLight, PointLight } from './three.module.js';
import { DeviceOrientationControls } from './DeviceOrientationControls.js';
import { OrientationControlsUI } from './OrientationControlsUI.js';

const DOControl_UI = new OrientationControlsUI(document.getElementById('debug-values'));

const _doc_canvas = document.getElementById('three-scene');
//si doc_canvas es null, no se puede hacer nada asi que tiramos un error:
if (!_doc_canvas) {
    throw new Error("No se encontró el elemento three-scene");
}

const renderer = new WebGLRenderer({
    canvas: _doc_canvas,
    antialias: true
});

renderer.setClearColor(0xcafebabe);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);

// camera
const camera = new PerspectiveCamera(
    35,
    window.innerWidth / window.innerHeight,
    0.1,
    3000
);
camera.position.set(0, 0, 0);

// scene
const scene = new Scene();

//Lights
const ambient = new AmbientLight(0xffffff, 0.7);
const point1 = new PointLight(0xffffff, 0.5);

scene.add(ambient);
scene.add(point1);

//mesh
var geometry = new BoxGeometry(10, 10, 10);
var material = new MeshBasicMaterial({ color: '#ffff' });
var mesh = new Mesh(geometry, material);
mesh.position.set(0, 0, -100);

scene.add(mesh);

//Usar gltf loader para cargar './assets/camera.gltf'
//const loader = new GLTFLoader();
//loader.load('./assets/camera.gltf', function (gltf) {
//    scene.add(gltf.scene);
//}, undefined, function (error) {
//    console.error(error);
//});

//TODO: Reimplementar esta parte
if(window.onorientationchange){
    console.log("window.onorientationchange event is supported");
}
if(screen.orientation.onchange){
    console.log("screen.orientation.onchange event is supported");
}

//Crear una instancia de nuestro DeviceOrientationControls
//const deviceControl = new DeviceOrientationControls(mesh);
const DOControl = new DeviceOrientationControls(camera);

//Suscribirse al evento de cambio de orientación de la pantalla
screen.orientation.addEventListener('change', (event) => {
    console.log("screen::window::orientationchange::100");
    console.log(event);
    DOControl.onScreen_OrientationChange(event);

    DOControl_UI.update();
});
window.addEventListener('orientationchange', (event) => {
    // console.log(event);
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

    DOControl.onScreen_OrientationChange(event);
    DOControl_UI.update();
});

//Suscribirse al evento de cambio de orientación del dispositivo
window.addEventListener('deviceorientation', (event) => {
    console.log("OrientationChangeEvent::window::deviceorientation::107");
    // console.log(event);
    DOControl.onDevice_OrientationChange(event);
    
    DOControl_UI.update();
});

function resize(){
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
}

//Modificamos la instancia de DOA_tests para que tenga una referencia a nuestro deviceControl
DOControl_UI.deviceOrientationControlObject = DOControl;

function render() {
    // mesh.rotation.x += 0.01
    // mesh.rotation.y += 0.01

    DOControl.update();
    //DOControl_UI.update();

    if(window.innerWidth != renderer.domElement.width || window.innerHeight != renderer.domElement.height){
        resize();
    }

    renderer.render(scene, camera);
    requestAnimationFrame(render);
}

requestAnimationFrame(render);
