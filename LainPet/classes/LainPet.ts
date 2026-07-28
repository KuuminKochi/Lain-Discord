import { LainElements } from "../types/LainElements";
import { LainState } from "../types/LainState";
import {
  add,
  subtract,
  magnitude,
  scale,
  normalize,
  dot,
  Vector2,
} from "../types/Vector2";

const assets = await fetch(
  "https://raw.githubusercontent.com/KuuminKochi/Lain-Discord/main/lain-assets.json",
).then((response) => response.json());

const dialogues = await fetch(
  "https://raw.githubusercontent.com/KuuminKochi/Lain-Discord/main/lain-dialogues.json",
).then((response) => response.json());

const SPRITE_SIZE = {
  normal: 100,
  event: 200,
};

export class LainPet {
  private lainElements: LainElements | null = null;
  private state: LainState = {
    position: { x: 100, y: 100 },
    velocity: { x: 0, y: 0 },
    target: { x: 100, y: 100 },
    speed: 3,
    outfit: "default",
    mode: "idle",
    isDragging: false,
    eventActive: false,
    sugarRush: false,
  };

  public start() {
    if (this.lainElements) return;

    const lainState = this.state;

    const container = document.createElement("div");
    const lainSprite = document.createElement("img");
    const bubble = document.createElement("div");
    const expression = document.createElement("img");

    this.lainElements = {
      container,
      lainSprite,
      bubble,
      expression,
    };

    container.style.cssText = `
	position:fixed;
	z-index:9999;
	pointer-events:none;
	top:0;
	left:0;
	width:100vw;
	height:100vh;
	`;

    lainSprite.style.cssText = `
	position:absolute;
	width:100px;
	pointer-events:auto;
	cursor:grab;
	transition: filter 0.2s;
	object-fit: contain;
	`;

    bubble.style.cssText = `
	position:absolute;
	background:white;
	color:black; border:2px solid black;
	padding:8px;
	border-radius:10px;
	font-family:monospace;
	font-size:12px; opacity:0;
	transition: opacity 0.5s;
	width:150px;
	text-align:center;
	z-index:10000;
	pointer-events:none;
	`;

    expression.style.cssText = `
	position:absolute;
	width:50px;
	opacity:0;
	transition: opacity 0.3s;
	z-index:10001;
	pointer-events:none;
	`;

    lainSprite.onmousedown = () => {
      lainState.isDragging = true;
      window.onmousemove = (ev) => {
        lainState.position.x = ev.clientX - 50;
        lainState.position.y = ev.clientY - 50;
        this.draw();
      };
      window.onmouseup = () => {
        lainState.isDragging = false;
        window.onmousemove = null;
      };
    };

    document.body.appendChild(container);
    container.appendChild(lainSprite);
    container.appendChild(bubble);
    container.appendChild(expression);
  }

  public setOutfit(outfit: LainState["outfit"]) {
    this.state.outfit = outfit;
  }

  private draw() {
    if (!this.lainElements) return;

    const lainState = this.state;

    const lainSpriteStyle = this.lainElements?.lainSprite.style;
    const lainContainerStyle = this.lainElements?.container.style;
    const lainBubbleStyle = this.lainElements?.bubble.style;
    const lainExpressionStyle = this.lainElements?.bubble.style;
    const size = this.state.eventActive
      ? SPRITE_SIZE.event
      : SPRITE_SIZE.normal;

    lainSpriteStyle.width = `${size}px`;
    lainSpriteStyle.left = `${lainState.position.x}px`;
    lainContainerStyle.top = `${lainState.position.y}px`;
    lainBubbleStyle.left = `${lainState.position.x + size / 2 - 75}px`;
    lainBubbleStyle.top = `${lainState.position.y - 50}px`;
    lainExpressionStyle.left = `${lainState.position.x + size / 2 - 25}px`;
    lainExpressionStyle.top = `${lainState.position.y - 40}px`;

    if (!lainState.eventActive) {
      const outfitAssets = assets[lainState.outfit];
      let spriteUrl = outfitAssets.idle;

      if (lainState.mode === "walk") {
        if (lainState.velocity.x >= 0) {
          spriteUrl = outfitAssets.right;
        } else {
          spriteUrl = outfitAssets.left;
        }
      }
    }

    if (lainState.sugarRush) {
      const hue = Date.now() % 360;

      lainSpriteStyle.filter = `hue-rotate(${hue}deg) brightness(1.2)`;
    } else {
      lainSpriteStyle.filter = "";
    }
  }

  private updatePhysics() {
    const lainState = this.state;

    if (lainState.isDragging) return;

    // this.updateNaviTarget();

    if (lainState.eventActive) {
      this.moveToEventCenter();
    } else if (lainState.sugarRush) {
      this.moveDuringSugarRush;
    } else if (lainState.mode == "walk") {
      this.moveTowardTarget();
    } else {
      this.tryToStartWalking();
    }

    this.draw();
  }

  private moveToEventCenter() {
    const lainState = this.state;

    const size = SPRITE_SIZE.event;
    const center = {
      x: (window.innerWidth - size) / 2,
      y: (window.innerHeight - size) / 2,
    };

    const d: Vector2 = subtract(center, lainState.position);
    const dp: Vector2 = scale(
      scale(d, 1.0 / magnitude(d)),
      Math.min(lainState.speed, magnitude(d) - 5),
    );
    lainState.position = add(lainState.position, dp);
  }

  private moveTowardTarget() {
    const lainState = this.state;

    const d: Vector2 = subtract(lainState.target, lainState.position);
    const dp: Vector2 = scale(
      scale(d, 1.0 / magnitude(d)),
      Math.min(lainState.speed, magnitude(d) - 5),
    );
    lainState.position = add(lainState.position, dp);
  }

  private moveDuringSugarRush() {
    const lainstate = this.state;

    const d: Vector2 = subtract(lainstate.target, lainstate.position);
    const dp: Vector2 = scale(
      scale(d, 1.0 / magnitude(d)),
      Math.min(lainstate.speed * 1.3, magnitude(d) - 5),
    );
    lainstate.position = add(lainstate.position, dp);
  }

  private tryToStartWalking() {
    const lainState = this.state;
    if (Math.random() >= 0.01) return;

    lainState.target = {
      x: Math.random() * (window.innerWidth - SPRITE_SIZE.normal),
      y: Math.random() * (window.innerHeight - SPRITE_SIZE.normal),
    };
  }
}
