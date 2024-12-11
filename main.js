import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js";

import { FBXLoader } from "https://cdn.jsdelivr.net/npm/three@0.118.1/examples/jsm/loaders/FBXLoader.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.118.1/examples/jsm/loaders/GLTFLoader.js";
import { _hideLoadingScreen, _showLoadingScreen, _updateLoadingProgress } from "./loading.js";

class BasicCharacterControllerProxy {
  constructor(animations) {
    this._animations = animations;
  }

  get animations() {
    return this._animations;
  }
}

class BasicCharacterController {
  constructor(params) {
    this._Init(params);
  }

  _Init(params) {
    this._params = params;
    this._raycaster = new THREE.Raycaster();
    this._mouse = new THREE.Vector2();
    this._clickedObject = null;

    this._decceleration = new THREE.Vector3(-0.0005, -0.0001, -5.0);
    this._acceleration = new THREE.Vector3(1, 0.25, 100.0);
    this._velocity = new THREE.Vector3(0, 0, 0);
    this._position = new THREE.Vector3();

    this._animations = {};
    this._input = new BasicCharacterControllerInput();
    this._stateMachine = new CharacterFSM(
      new BasicCharacterControllerProxy(this._animations)
    );

    this._LoadModels();

    this._AddMouseClickListener();
  }

  _LoadModels() {
    // Set up the LoadingManager
    _showLoadingScreen();

    this._manager = new THREE.LoadingManager(
      // onLoad callback
      () => {
        console.log("All models loaded successfully");
        _hideLoadingScreen();
        if (this._stateMachine) {
          this._stateMachine.SetState("idle");
        }
      },
      // onProgress callback
      (url, itemsLoaded, itemsTotal) => {
        const progress = Math.round((itemsLoaded / itemsTotal) * 100);
        _updateLoadingProgress(progress);
      },
      // onError callback
      (url, error) => {
        console.error(`Error loading ${url}: ${error}`);
      }
    );

    const loader = new FBXLoader(this._manager); // Use the manager here
    loader.setPath("./resources/zombie/");
    loader.load("vendingold.fbx", (fbx) => {
      fbx.traverse((c) => {
        c.castShadow = true;
      });
      fbx.scale.setScalar(0.1);
      fbx.position.set(0, 0, 0);
      this._params.scene.add(fbx);

      this._vendingMachine = fbx;
    });
    loader.load("officefuture.fbx", (fbx) => {
      fbx.traverse((c) => {
        c.castShadow = true;
      });
      fbx.scale.setScalar(0.5);
      fbx.position.set(0, 0, 0);
      this._params.scene.add(fbx);

      this._office = fbx;
    });
    loader.load("screen2.fbx", (fbx) => {
      fbx.traverse((c) => {
        c.castShadow = true;
      });
      // fbx.rotation.y = - Math.PI/2 ;
      fbx.scale.setScalar(3);
      fbx.position.set(-120, 0, 90);
      this._params.scene.add(fbx);

      this._office = fbx;
    });
    loader.load("new.fbx", (fbx) => {
      fbx.traverse((c) => {
        if (c.isMesh) {
          c.castShadow = true;

          // Set transparency
          if (c.material) {
            c.material.transparent = true;
            c.material.opacity = 20; // Adjust this value for desired transparency
          }
        }
      });
      fbx.rotation.y = Math.PI  ;
      fbx.scale.setScalar(0.1);
      fbx.position.set(-115, 2, 135);
      this._params.scene.add(fbx);

      this._gas = fbx;
    });
    loader.load("spacecar.fbx", (fbx) => {
      fbx.traverse((c) => {
        c.castShadow = true;
      });

      fbx.scale.setScalar(25);
      fbx.position.set(-120, 15, 30);
      this._params.scene.add(fbx);

      this._carfly = fbx;
    });
    loader.load("building.fbx", (fbx) => {
      fbx.traverse((c) => {
        c.castShadow = true;
      });
      fbx.scale.setScalar(0.1);
      fbx.position.set(100, 0, 0);
      this._params.scene.add(fbx);

      this._building = fbx;
    });
    loader.load("fence.fbx", (fbx) => {
      // Prepare the base fence configuration
      fbx.traverse((c) => {
        c.castShadow = true;
        if (c.material) {
          c.material.transparent = true;
          c.material.opacity = 1;
        }
      });
    
      // Create an array to store all fence instances
      this._fences = [fbx];
    
      // Predefined positions for the fences
      const positions = [
        { x: 148, z: 70 },
        { x: 148, z: 115 },
        { x: 148, z: 160 },
        { x: 148, z: 205 },
        { x: 148, z: 250 },
        { x: 148, z: 295 },
        { x: 148, z: 340 },
        { x: 148, z: 385 }
      ];
    
      // Create clones and position them
      positions.slice(1).forEach((pos) => {
        const fenceClone = fbx.clone();
        
        fenceClone.scale.setScalar(0.08);
        fenceClone.position.set(pos.x, 0, pos.z);
        fenceClone.rotation.y = -Math.PI / 2;
        
        this._params.scene.add(fenceClone);
        this._fences.push(fenceClone);
      });
    
      // Position and add the original fence
      fbx.scale.setScalar(0.08);
      fbx.position.set(148, 0, 70);
      fbx.rotation.y = -Math.PI / 2;
      this._params.scene.add(fbx);
    });
    
    loader.load("ananthu.fbx", (fbx) => {
      fbx.scale.setScalar(0.1);
      fbx.traverse((c) => {
        c.castShadow = true;
      });
      fbx.position.set(-130, 0, 105);
      //how can i stop the moving ananthu.fbx model when it touchers the VendingMachineFinal01 as normal objects
      fbx.rotation.y =  Math.PI /2 ;

      this._target = fbx;
      this._params.scene.add(this._target);

      this._mixer = new THREE.AnimationMixer(this._target);

      this._manager = new THREE.LoadingManager();
      this._manager.onLoad = () => {
        this._stateMachine.SetState("idle");
      };

      const _OnLoad = (animName, anim) => {
        const clip = anim.animations[0];
        const action = this._mixer.clipAction(clip);

        this._animations[animName] = {
          clip: clip,
          action: action,
        };
      };

      const loader = new FBXLoader(this._manager);
      loader.setPath("./resources/zombie/");
      loader.load("walking.fbx", (a) => {
        _OnLoad("walk", a);
      });
      loader.load("running.fbx", (a) => {
        _OnLoad("run", a);
      });
      loader.load("breathing.fbx", (a) => {
        _OnLoad("idle", a);
      });
      loader.load("dancing.fbx", (a) => {
        _OnLoad("dance", a);
      });
      loader.load("walkingback.fbx", (a) => {
        _OnLoad("walkback", a);
      });
      loader.load("walkleft.fbx", (a) => {
        _OnLoad("walkleft", a);
      });
      loader.load("walkright.fbx", (a) => {
        _OnLoad("walkright", a);
      });
    });
  }

  _AddMouseClickListener() {
    window.addEventListener(
      "click",
      (event) => this._OnMouseClick(event),
      false
    );
  }

  _OnMouseClick(event) {
    // Normalize mouse position
    this._mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this._mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Update the raycaster
    this._raycaster.setFromCamera(this._mouse, this._params.camera);

    // Check for intersections
    const intersects = this._raycaster.intersectObjects(
      this._params.scene.children,
      true
    );

    if (intersects.length > 0) {
      const clickedObject = intersects[0].object;

      // Check if the clicked object is the vending machine
      if (clickedObject.parent === this._vendingMachine) {
        // window.open('vending.html', '_blank');
        this._showPopup();
      }
    }
  }

  _showPopup() {
    // Example cola names
    const colaNames = ["Coca-Cola", "Pepsi", "Sprite", "Fanta", "Mountain Dew"];

    // Create the popup container
    const popup = document.createElement("div");
    popup.id = "cola-popup";
    popup.style.position = "fixed";
    popup.style.top = "50%";
    popup.style.left = "50%";
    popup.style.transform = "translate(-50%, -50%)";
    popup.style.width = "300px";
    popup.style.maxHeight = "400px";
    popup.style.overflowY = "scroll";
    popup.style.backgroundColor = "white";
    popup.style.border = "2px solid black";
    popup.style.borderRadius = "10px";
    popup.style.padding = "10px";
    popup.style.zIndex = "1000";
    popup.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.2)";

    // Add title
    const title = document.createElement("h3");
    title.innerText = "Available Colas";
    title.style.textAlign = "center";
    popup.appendChild(title);

    // Add cola names
    colaNames.forEach((name) => {
      const item = document.createElement("div");
      item.innerText = name;
      item.style.padding = "5px";
      item.style.cursor = "pointer";
      item.style.borderBottom = "1px solid #ddd";

      // Add hover effect
      item.addEventListener("mouseover", () => {
        item.style.backgroundColor = "#f0f0f0";
      });
      item.addEventListener("mouseout", () => {
        item.style.backgroundColor = "white";
      });

      // Handle cola click
      item.addEventListener("click", () => {
        alert(`You selected: ${name}`);
        document.body.removeChild(popup); // Close the popup
      });

      popup.appendChild(item);
    });

    // Add close button
    const closeButton = document.createElement("button");
    closeButton.innerText = "Close";
    closeButton.style.display = "block";
    closeButton.style.margin = "10px auto 0";
    closeButton.style.padding = "5px 10px";
    closeButton.style.cursor = "pointer";

    closeButton.addEventListener("click", () => {
      document.body.removeChild(popup); // Remove the popup
    });

    popup.appendChild(closeButton);

    // Add the popup to the document
    document.body.appendChild(popup);
  }

  get Position() {
    return this._position;
  }

  get Rotation() {
    if (!this._target) {
      return new THREE.Quaternion();
    }
    return this._target.quaternion;
  }

  Update(timeInSeconds) {
    if (!this._stateMachine._currentState) {
      return;
    }
    const velocity = this._velocity;
    const frameDecceleration = new THREE.Vector3(
      velocity.x * this._decceleration.x,
      velocity.y * this._decceleration.y,
      velocity.z * this._decceleration.z
    );
    frameDecceleration.multiplyScalar(timeInSeconds);
    frameDecceleration.z =
      Math.sign(frameDecceleration.z) *
      Math.min(Math.abs(frameDecceleration.z), Math.abs(velocity.z));

    velocity.add(frameDecceleration);

    const vendingMachineBBox = new THREE.Box3().setFromObject(
      this._vendingMachine
    );
    // const fencesBBox = new THREE.Box3().setFromObject(
    //   this._fences
    // );
    const characterBBox = new THREE.Box3().setFromObject(this._target);
    const width = 15; // X-axis extent
    const length = 10; // Z-axis extent

    // Define the minimum and maximum points of the Box3
    const min = new THREE.Vector3(-width / 2, 0, -length / 2); // Bottom-left corner
    const max = new THREE.Vector3(width / 2, 0, length / 2); // Top-right corner

    // Create the Box3
    const officeBBox = new THREE.Box3(min, max);

    this._stateMachine.Update(timeInSeconds, this._input);

    const controlObject = this._target;
    const _Q = new THREE.Quaternion();
    const _A = new THREE.Vector3();
    const _R = controlObject.quaternion.clone();

    const acc = this._acceleration.clone();
    if (this._input._keys.shift) {
      acc.multiplyScalar(2.0);
    }

    if (this._stateMachine._currentState.Name == "dance") {
      acc.multiplyScalar(0.0);
    }

    if (officeBBox.intersectsBox(characterBBox)) {
      if (!this._input._keys.backward) {
        velocity.x = 0;
        velocity.y = 0;
        velocity.z = 0;
        // this._stateMachine.SetState("idle");
      } else {
        velocity.z -= acc.z * timeInSeconds;
      }
    } else if (vendingMachineBBox.intersectsBox(characterBBox)) {
      if (!this._input._keys.backward) {
        velocity.x = 0;
        velocity.y = 0;
        velocity.z = 0;
        // this._stateMachine.SetState("idle");
      } else {
        velocity.z -= acc.z * timeInSeconds;
      }
    } else {
      if (
        !this._input._keys.left &&
        !this._input._keys.right &&
        !this._input._keys.moveLeft &&
        !this._input._keys.moveRight
      ) {
        velocity.x = 0;
      }

      if (this._input._keys.forward) {
        velocity.z += acc.z * timeInSeconds;
      }
      if (this._input._keys.backward) {
        velocity.z -= acc.z * timeInSeconds;
      }
      if (this._input._keys.moveRight) {
        velocity.x -= acc.x * timeInSeconds * 2;
      }
      if (this._input._keys.moveLeft) {
        velocity.x += acc.x * timeInSeconds * 2;
      }
      if (this._input._keys.left) {
        _A.set(0, 1, 0);
        _Q.setFromAxisAngle(
          _A,
          4.0 * Math.PI * timeInSeconds * this._acceleration.y
        );
        _R.multiply(_Q);
      }
      if (this._input._keys.right) {
        _A.set(0, 1, 0);
        _Q.setFromAxisAngle(
          _A,
          4.0 * -Math.PI * timeInSeconds * this._acceleration.y
        );
        _R.multiply(_Q);
      }
    }

    controlObject.quaternion.copy(_R);

    const oldPosition = new THREE.Vector3();
    oldPosition.copy(controlObject.position);

    const forward = new THREE.Vector3(0, 0, 1);
    forward.applyQuaternion(controlObject.quaternion);
    forward.normalize();

    const sideways = new THREE.Vector3(1, 0, 0);
    sideways.applyQuaternion(controlObject.quaternion);
    sideways.normalize();

    sideways.multiplyScalar(velocity.x * timeInSeconds);
    forward.multiplyScalar(velocity.z * timeInSeconds);

    controlObject.position.add(forward);
    controlObject.position.add(sideways);

    this._position.copy(controlObject.position);

    if (this._mixer) {
      this._mixer.update(timeInSeconds);
    }
  }
}

class BasicCharacterControllerInput {
  constructor() {
    this._Init();
  }

  _Init() {
    this._keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      space: false,
      shift: false,
      moveLeft: false,
      moveRight: false,
    };
    document.addEventListener("keydown", (e) => this._onKeyDown(e), false);
    document.addEventListener("keyup", (e) => this._onKeyUp(e), false);
  }

  _onKeyDown(event) {
    switch (event.keyCode) {
      case 87: // w
        this._keys.forward = true;
        break;
      case 65: // a
        this._keys.left = true;
        break;
      case 83: // s
        this._keys.backward = true;
        break;
      case 68: // d
        this._keys.right = true;
        break;
      case 32: // SPACE
        this._keys.space = true;
        break;
      case 16: // SHIFT
        this._keys.shift = true;
        break;
      case 37: // LEFT ARROW
        this._keys.moveLeft = true;
        break;
      case 39: // RIGHT ARROW
        this._keys.moveRight = true;
        break;
    }
  }

  _onKeyUp(event) {
    switch (event.keyCode) {
      case 87: // w
        this._keys.forward = false;
        break;
      case 65: // a
        this._keys.left = false;
        break;
      case 83: // s
        this._keys.backward = false;
        break;
      case 68: // d
        this._keys.right = false;
        break;
      case 32: // SPACE
        this._keys.space = false;
        break;
      case 16: // SHIFT
        this._keys.shift = false;
        break;
      case 37: // LEFT ARROW
        this._keys.moveLeft = false;
        break;
      case 39: // RIGHT ARROW
        this._keys.moveRight = false;
        break;
    }
  }
}

class FiniteStateMachine {
  constructor() {
    this._states = {};
    this._currentState = null;
  }

  _AddState(name, type) {
    this._states[name] = type;
  }

  SetState(name) {
    const prevState = this._currentState;

    if (prevState) {
      if (prevState.Name == name) {
        return;
      }
      prevState.Exit();
    }

    const state = new this._states[name](this);

    this._currentState = state;
    state.Enter(prevState);
  }

  Update(timeElapsed, input) {
    if (this._currentState) {
      this._currentState.Update(timeElapsed, input);
    }
  }
}

class CharacterFSM extends FiniteStateMachine {
  constructor(proxy) {
    super();
    this._proxy = proxy;
    this._Init();
  }

  _Init() {
    this._AddState("idle", IdleState);
    this._AddState("walk", WalkState);
    this._AddState("walkback", WalkBackState);
    this._AddState("run", RunState);
    this._AddState("dance", DanceState);
    this._AddState("walkleft", WalkLeftState);
    this._AddState("walkright", WalkRightState);
  }
}

class State {
  constructor(parent) {
    this._parent = parent;
  }

  Enter() {}
  Exit() {}
  Update() {}
}

class DanceState extends State {
  constructor(parent) {
    super(parent);

    this._FinishedCallback = () => {
      this._Finished();
    };
  }

  get Name() {
    return "dance";
  }

  Enter(prevState) {
    const curAction = this._parent._proxy._animations["dance"].action;
    const mixer = curAction.getMixer();
    mixer.addEventListener("finished", this._FinishedCallback);

    if (prevState) {
      const prevAction = this._parent._proxy._animations[prevState.Name].action;

      curAction.reset();
      curAction.setLoop(THREE.LoopOnce, 1);
      curAction.clampWhenFinished = true;
      curAction.crossFadeFrom(prevAction, 0.2, true);
      curAction.play();
    } else {
      curAction.play();
    }
  }

  _Finished() {
    this._Cleanup();
    this._parent.SetState("idle");
  }

  _Cleanup() {
    const action = this._parent._proxy._animations["dance"].action;

    action.getMixer().removeEventListener("finished", this._CleanupCallback);
  }

  Exit() {
    this._Cleanup();
  }

  Update(_) {}
}

class WalkState extends State {
  constructor(parent) {
    super(parent);
  }

  get Name() {
    return "walk";
  }

  Enter(prevState) {
    const curAction = this._parent._proxy._animations["walk"].action;
    if (prevState) {
      const prevAction = this._parent._proxy._animations[prevState.Name].action;

      curAction.enabled = true;

      if (prevState.Name == "run") {
        const ratio =
          curAction.getClip().duration / prevAction.getClip().duration;
        curAction.time = prevAction.time * ratio;
      } else {
        curAction.time = 0.0;
        curAction.setEffectiveTimeScale(1.0);
        curAction.setEffectiveWeight(1.0);
      }

      curAction.crossFadeFrom(prevAction, 0.5, true);
      curAction.play();
    } else {
      curAction.play();
    }
  }

  Exit() {}

  Update(timeElapsed, input) {
    if (input._keys.forward || input._keys.backward) {
      if (input._keys.shift) {
        this._parent.SetState("run");
      }
      return;
    }
    if (input._keys.backward) {
      if (!input._keys.shift) {
        this._parent.SetState("walkbac");
      }
      return;
    }

    this._parent.SetState("idle");
  }
}

class WalkBackState extends State {
  constructor(parent) {
    super(parent);
  }

  get Name() {
    return "walkback";
  }

  Enter(prevState) {
    const curAction = this._parent._proxy._animations["walkback"].action;
    if (prevState) {
      const prevAction = this._parent._proxy._animations[prevState.Name].action;

      curAction.enabled = true;

      if (prevState.Name == "walkback") {
        const ratio =
          curAction.getClip().duration / prevAction.getClip().duration;
        curAction.time = prevAction.time * ratio;
      } else {
        curAction.time = 0.0;
        curAction.setEffectiveTimeScale(1.0);
        curAction.setEffectiveWeight(1.0);
      }

      curAction.crossFadeFrom(prevAction, 0.5, true);
      curAction.play();
    } else {
      curAction.play();
    }
  }

  Exit() {}

  Update(timeElapsed, input) {
    if (input._keys.forward || input._keys.backward) {
      if (input._keys.shift) {
        this._parent.SetState("run");
      }
      return;
    }

    this._parent.SetState("idle");
  }
}

class RunState extends State {
  constructor(parent) {
    super(parent);
  }

  get Name() {
    return "run";
  }

  Enter(prevState) {
    const curAction = this._parent._proxy._animations["run"].action;
    if (prevState) {
      const prevAction = this._parent._proxy._animations[prevState.Name].action;

      curAction.enabled = true;

      if (prevState.Name == "walk") {
        const ratio =
          curAction.getClip().duration / prevAction.getClip().duration;
        curAction.time = prevAction.time * ratio;
      } else {
        curAction.time = 0.0;
        curAction.setEffectiveTimeScale(1.0);
        curAction.setEffectiveWeight(1.0);
      }

      curAction.crossFadeFrom(prevAction, 0.5, true);
      curAction.play();
    } else {
      curAction.play();
    }
  }

  Exit() {}

  Update(timeElapsed, input) {
    if (input._keys.forward) {
      if (!input._keys.shift) {
        this._parent.SetState("walk");
      }
      return;
    } else if (input._keys.backward) {
      if (!input._keys.shift) {
        this._parent.SetState("walkback");
      }
      return;
    }

    this._parent.SetState("idle");
  }
}

class IdleState extends State {
  constructor(parent) {
    super(parent);
  }

  get Name() {
    return "idle";
  }

  Enter(prevState) {
    const idleAction = this._parent._proxy._animations["idle"].action;
    if (prevState) {
      const prevAction = this._parent._proxy._animations[prevState.Name].action;
      idleAction.time = 0.0;
      idleAction.enabled = true;
      idleAction.setEffectiveTimeScale(1.0);
      idleAction.setEffectiveWeight(1.0);
      idleAction.crossFadeFrom(prevAction, 0.5, true);
      idleAction.play();
    } else {
      idleAction.play();
    }
  }

  Exit() {}

  Update(_, input) {
    if (input._keys.forward) {
      this._parent.SetState("walk");
    } else if (input._keys.backward) {
      this._parent.SetState("walkback");
    } else if (input._keys.space) {
      this._parent.SetState("dance");
    } else if (input._keys.moveLeft) {
      this._parent.SetState("walkleft");
    } else if (input._keys.moveRight) {
      this._parent.SetState("walkright");
    }
  }
}
class WalkLeftState extends State {
  constructor(parent) {
    super(parent);
  }

  get Name() {
    return "walkleft";
  }

  Enter(prevState) {
    const curAction = this._parent._proxy._animations["walkleft"].action;
    if (prevState) {
      const prevAction = this._parent._proxy._animations[prevState.Name].action;
      curAction.enabled = true;
      curAction.time = 0.0;
      curAction.setEffectiveTimeScale(1.0);
      curAction.setEffectiveWeight(1.0);
      curAction.crossFadeFrom(prevAction, 0.5, true);
      curAction.play();
    } else {
      curAction.play();
    }
  }

  Exit() {}

  Update(timeElapsed, input) {
    if (!input._keys.moveLeft) {
      this._parent.SetState("idle"); // Transition to idle if no left movement
    }
  }
}

class WalkRightState extends State {
  constructor(parent) {
    super(parent);
  }

  get Name() {
    return "walkright";
  }

  Enter(prevState) {
    const curAction = this._parent._proxy._animations["walkright"].action;
    if (prevState) {
      const prevAction = this._parent._proxy._animations[prevState.Name].action;
      curAction.enabled = true;
      curAction.time = 0.0;
      curAction.setEffectiveTimeScale(1.0);
      curAction.setEffectiveWeight(1.0);
      curAction.crossFadeFrom(prevAction, 0.5, true);
      curAction.play();
    } else {
      curAction.play();
    }
  }

  Exit() {}

  Update(timeElapsed, input) {
    if (!input._keys.moveRight) {
      this._parent.SetState("idle"); // Transition to idle if no right movement
    }
  }
}

class ThirdPersonCamera {
  constructor(params) {
    this._params = params;
    this._camera = params.camera;

    this._currentPosition = new THREE.Vector3();
    this._currentLookat = new THREE.Vector3();
  }

  _CalculateIdealOffset() {
    const idealOffset = new THREE.Vector3(-10, 20, -28);
    idealOffset.applyQuaternion(this._params.target.Rotation);
    idealOffset.add(this._params.target.Position);
    return idealOffset;
  }

  _CalculateIdealLookat() {
    const idealLookat = new THREE.Vector3(0, 10, 50);
    idealLookat.applyQuaternion(this._params.target.Rotation);
    idealLookat.add(this._params.target.Position);
    return idealLookat;
  }

  Update(timeElapsed) {
    const idealOffset = this._CalculateIdealOffset();
    const idealLookat = this._CalculateIdealLookat();

    // const t = 0.05;
    // const t = 4.0 * timeElapsed;
    const t = 1.0 - Math.pow(0.001, timeElapsed);

    this._currentPosition.lerp(idealOffset, t);
    this._currentLookat.lerp(idealLookat, t);

    this._camera.position.copy(this._currentPosition);
    this._camera.lookAt(this._currentLookat);
  }
}

class ThirdPersonCameraDemo {
  constructor() {
    this._Initialize();
  }

  _Initialize() {
    this._threejs = new THREE.WebGLRenderer({
      antialias: true,
    });
    this._threejs.outputEncoding = THREE.sRGBEncoding;
    this._threejs.shadowMap.enabled = true;
    this._threejs.shadowMap.type = THREE.PCFSoftShadowMap;
    this._threejs.setPixelRatio(window.devicePixelRatio);
    this._threejs.setSize(window.innerWidth, window.innerHeight);

    document.body.appendChild(this._threejs.domElement);

    window.addEventListener(
      "resize",
      () => {
        this._OnWindowResize();
      },
      false
    );

    const fov = 60;
    const aspect = 1920 / 1080;
    const near = 1.0;
    const far = 1000.0;
    this._camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    this._camera.position.set(150, 10, 25);

    this._scene = new THREE.Scene();

    let light = new THREE.DirectionalLight(0xffffff, 0.3);
    // Set light position and target
    light.position.set(-200, 200, 200); // Position the light at the desired location
    light.target.position.set(0, 0, 0); // Targeting the center (0, 0, 0)

    // Enable casting shadows
    light.castShadow = true;

    // Adjust shadow bias (for preventing artifacts like shadow acne)
    light.shadow.bias = -0.001;

    // Set shadow map resolution for sharper shadows
    light.shadow.mapSize.width = 4096; // Increase resolution for sharper shadows
    light.shadow.mapSize.height = 4096;

    // Adjust the near and far properties of the shadow camera
    light.shadow.camera.near = 0.5; // Set near plane for the shadow camera
    light.shadow.camera.far = 500.0; // Set far plane for the shadow camera

    // Adjust the size of the shadow camera frustum (left, right, top, bottom)
    light.shadow.camera.left = -200; // Set the left side of the frustum
    light.shadow.camera.right = 200; // Set the right side of the frustum
    light.shadow.camera.top = 200; // Set the top side of the frustum
    light.shadow.camera.bottom = -200; // Set the bottom side of the frustum

    this._scene.add(light);

    light = new THREE.AmbientLight(0xffffff, 0.05);
    this._scene.add(light);

    const loader = new THREE.CubeTextureLoader();
    const texture = loader.load([
      "./resources/right.png", // Positive X
      "./resources/left.png", // Negative X
      "./resources/top.png", // Positive Y
      "./resources/bottom.png", // Negative Y
      "./resources/front.png", // Positive Z
      "./resources/back.png", // Negative Z
    ]);
    texture.encoding = THREE.sRGBEncoding; // Ensure correct color encoding
    this._scene.background = texture;
    const textureLoader = new THREE.TextureLoader();

    const textureGround = textureLoader.load("./resources/ground.jpg");

    // Configure the texture for repeating
    textureGround.wrapS = THREE.RepeatWrapping; // Repeat horizontally
    textureGround.wrapT = THREE.RepeatWrapping; // Repeat vertically
    textureGround.repeat.set(10, 10); // Set repetition count

    // Create the plane with the textured material
    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(300, 300, 10, 10),
      new THREE.MeshStandardMaterial({
        map: textureGround, // Apply the texture
      })
    );

// Set plane rotation to be flat on the ground (if needed)
plane.rotation.x = -Math.PI / 2;

// Create bounding box
const boundingBox = new THREE.Box3().setFromObject(plane);

// Expand the bounding box by 2 units in each direction
boundingBox.expandByScalar(2);

// Now you can get the min and max corners of the expanded box
const minCorner = boundingBox.min;
const maxCorner = boundingBox.max;

// If you want to get the specific coordinates
const edgePositions = {
    bottomLeft: new THREE.Vector3(minCorner.x, minCorner.y, minCorner.z),
    topRight: new THREE.Vector3(maxCorner.x, maxCorner.y, maxCorner.z)
};

// Optional: Visualize the bounding box
const boxHelper = new THREE.Box3Helper(boundingBox, 0xffff00);
this._params.scene.add(boxHelper);
    // Add the plane to the scene
    plane.castShadow = false;
    plane.receiveShadow = true;
    plane.rotation.x = -Math.PI / 2;
    this._scene.add(plane);
    this._mixers = [];
    this._previousRAF = null;

    this._LoadAnimatedModel();
    this._RAF();
  }

  _LoadAnimatedModel() {
    const params = {
      camera: this._camera,
      scene: this._scene,
    };
    this._controls = new BasicCharacterController(params);

    this._thirdPersonCamera = new ThirdPersonCamera({
      camera: this._camera,
      target: this._controls,
    });
  }

  _OnWindowResize() {
    this._camera.aspect = window.innerWidth / window.innerHeight;
    this._camera.updateProjectionMatrix();
    this._threejs.setSize(window.innerWidth, window.innerHeight);
  }

  _RAF() {
    requestAnimationFrame((t) => {
      if (this._previousRAF === null) {
        this._previousRAF = t;
      }

      this._RAF();

      this._threejs.render(this._scene, this._camera);
      this._Step(t - this._previousRAF);
      this._previousRAF = t;
    });
  }

  _Step(timeElapsed) {
    const timeElapsedS = timeElapsed * 0.001;
    if (this._mixers) {
      this._mixers.map((m) => m.update(timeElapsedS));
    }

    if (this._controls) {
      this._controls.Update(timeElapsedS);
    }

    this._thirdPersonCamera.Update(timeElapsedS);
  }
}

let _APP = null;

window.addEventListener("DOMContentLoaded", () => {
  _APP = new ThirdPersonCameraDemo();
});

function _LerpOverFrames(frames, t) {
  const s = new THREE.Vector3(0, 0, 0);
  const e = new THREE.Vector3(100, 0, 0);
  const c = s.clone();

  for (let i = 0; i < frames; i++) {
    c.lerp(e, t);
  }
  return c;
}

function _TestLerp(t1, t2) {
  const v1 = _LerpOverFrames(100, t1);
  const v2 = _LerpOverFrames(50, t2);
  console.log(v1.x + " | " + v2.x);
}

_TestLerp(0.01, 0.01);
_TestLerp(1.0 / 100.0, 1.0 / 50.0);
_TestLerp(1.0 - Math.pow(0.3, 1.0 / 100.0), 1.0 - Math.pow(0.3, 1.0 / 50.0));
