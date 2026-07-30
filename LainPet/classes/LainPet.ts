import { TimeoutRegistry } from "./TimeoutRegistry";
import { assets, dialogues } from "../data/assets";
import { LainElements } from "../types/LainElements";
import { LainState } from "../types/LainState";
import {
  add,
  subtract,
  magnitude,
  scale,
  Vector2,
} from "../types/Vector2";

const SPRITE_SIZE = {
  normal: 100,
  event: 200,
};
const IDLE_DURATION = 5000;
const MOVEMENT_TIMEOUT = 10000;
const WALK_RADIUS = 500;
const WALK_MIN_DISTANCE = 100;
const TARGET_RADIUS = 5;

export class LainPet {
  private lainElements: LainElements | null = null;
  private physicsInterval: number | null = null;
  private timeouts = new TimeoutRegistry();
  private idleUntil = 0;
  private movementTimeout: number | null = null;
  private movementTarget: Vector2 | null = null;
  private movementTimedOut = false;
  private facing: "left" | "right" = "right";
  private expressionTimeout: number | null = null;
  private dialogueTimeout: number | null = null;
  private sugarRushTimeout: number | null = null;
  private eventTimeout: number | null = null;
  private expressionInvocation = 0;
  private dialogueInvocation = 0;
  private sugarRushInvocation = 0;
  private eventInvocation = 0;
  private dragMoveHandler: ((event: MouseEvent) => void) | null = null;
  private dragUpHandler: (() => void) | null = null;
  private schedule(callback: () => void, delay: number): number {
    return this.timeouts.schedule(callback, delay);
  }
  private cancelTimeout(timeoutId: number | null): void {
    this.timeouts.cancel(timeoutId);
  }
  private removeDragListeners() {
    if (this.dragMoveHandler) {
      window.removeEventListener("mousemove", this.dragMoveHandler);
      this.dragMoveHandler = null;
    }

    if (this.dragUpHandler) {
      window.removeEventListener("mouseup", this.dragUpHandler);
      this.dragUpHandler = null;
    }
  }
  private cancelMovementTimeout() {
    if (this.movementTimeout === null) return;

    this.cancelTimeout(this.movementTimeout);
    this.movementTimeout = null;
  }

  private startMovement(
    target: Vector2,
    timeout = MOVEMENT_TIMEOUT,
  ): boolean {
    const sameTarget =
      this.movementTarget?.x === target.x &&
      this.movementTarget?.y === target.y;

    if (sameTarget && this.state.mode === "walk") {
      return true;
    }

    if (
      sameTarget &&
      this.movementTimedOut &&
      Date.now() < this.idleUntil
    ) {
      return false;
    }

    this.cancelMovementTimeout();
    this.movementTarget = { ...target };
    this.movementTimedOut = false;
    this.state.target = { ...target };
    this.state.mode = "walk";

    const timeoutId = this.schedule(() => {
      if (this.movementTimeout !== timeoutId) return;

      this.movementTimeout = null;
      this.movementTimedOut = true;
      this.state.mode = "idle";
      this.state.velocity = { x: 0, y: 0 };
      this.idleUntil = Date.now() + IDLE_DURATION;
    }, timeout);

    this.movementTimeout = timeoutId;
    return true;
  }

  private finishMovement() {
    this.cancelMovementTimeout();
    this.movementTarget = null;
    this.movementTimedOut = false;
    this.state.mode = "idle";
    this.state.velocity = { x: 0, y: 0 };
    this.idleUntil = Date.now() + IDLE_DURATION;
  }

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

    lainSprite.onmousedown = (event) => {
      event.preventDefault();
      lainState.isDragging = true;
      this.removeDragListeners();

      const dragMoveHandler = (ev: MouseEvent) => {
        lainState.position.x = ev.clientX - 50;
        lainState.position.y = ev.clientY - 50;
        this.draw();
      };
      const dragUpHandler = () => {
        lainState.isDragging = false;
        this.removeDragListeners();
      };

      this.dragMoveHandler = dragMoveHandler;
      this.dragUpHandler = dragUpHandler;
      window.addEventListener("mousemove", dragMoveHandler);
      window.addEventListener("mouseup", dragUpHandler);
    };

    document.body.appendChild(container);
    container.appendChild(lainSprite);
    container.appendChild(bubble);
    container.appendChild(expression);

    this.physicsInterval = window.setInterval(() => {
      this.updatePhysics();
    }, 30);
  }

  public stop() {
    const lainState = this.state;
    const lainElements = this.lainElements;
    if (this.physicsInterval !== null) {
      window.clearInterval(this.physicsInterval);
      this.physicsInterval = null;
    }
    this.cancelMovementTimeout();
    this.timeouts.clear();
    this.expressionTimeout = null;
    this.dialogueTimeout = null;
    this.sugarRushTimeout = null;
    this.eventTimeout = null;
    this.expressionInvocation++;
    this.dialogueInvocation++;
    this.sugarRushInvocation++;
    this.eventInvocation++;

    this.removeDragListeners();

    if (lainElements) {
      lainElements.lainSprite.onmousedown = null;
      lainElements.container.remove();
      this.lainElements = null;
    }

    lainState.position = { x: 100, y: 100 };
    lainState.velocity = { x: 0, y: 0 };
    lainState.target = { x: 100, y: 100 };
    lainState.mode = "idle";
    lainState.isDragging = false;
    lainState.eventActive = false;
    lainState.sugarRush = false;
    this.idleUntil = 0;
    this.movementTarget = null;
    this.movementTimedOut = false;
    this.facing = "right";
  }

  public isRunning() {
    return this.lainElements !== null;
  }

  public wear(outfit: LainState["outfit"]) {
    this.state.outfit = outfit;
  }

  public forceRoll() {
    this.triggerSpecialEvent("bear");
  }

  public forceBurn() {
    this.triggerSpecialEvent("school");
  }

  public forceDance() {
    this.triggerSpecialEvent("pink");
  }

  public sugarRush() {
    this.triggerSugarRush();
  }

  public express() {
    this.triggerExpression();
  }

  public speak(text?: string) {
    this.showDialogue(text);
  }
  public specialEvent() {
    this.triggerSpecialEvent();
  }

  public getPosition(): Vector2 | null {
    if (!this.isRunning()) return null;

    return { ...this.state.position };
  }
  private isWithinTargetRadius(target: Vector2) {
    return (
      magnitude(subtract(target, this.state.position)) <= TARGET_RADIUS
    );
  }

  public moveTo(target: Vector2) {
    if (!this.isRunning() || this.state.sugarRush) return;

    this.state.target = { ...target };

    if (this.isWithinTargetRadius(target)) {
      this.finishMovement();
      return;
    }

    this.startMovement(target);
  }

  private draw() {
    if (!this.lainElements) return;

    const lainState = this.state;

    const lainSpriteStyle = this.lainElements?.lainSprite.style;
    const lainBubbleStyle = this.lainElements?.bubble.style;
    const lainExpressionStyle = this.lainElements?.expression.style;
    const size = this.state.eventActive
      ? SPRITE_SIZE.event
      : SPRITE_SIZE.normal;

    lainSpriteStyle.width = `${size}px`;
    lainSpriteStyle.left = `${lainState.position.x}px`;
    lainSpriteStyle.top = `${lainState.position.y}px`;
    lainBubbleStyle.left = `${lainState.position.x + size / 2 - 75}px`;
    lainBubbleStyle.top = `${lainState.position.y - 50}px`;
    lainExpressionStyle.left = `${lainState.position.x + size / 2 - 25}px`;
    lainExpressionStyle.top = `${lainState.position.y - 40}px`;

    if (!lainState.eventActive) {
      const outfitAssets = assets[lainState.outfit];
      let spriteUrl = outfitAssets.idle;

      if (lainState.mode === "walk") {
        spriteUrl =
          this.facing === "right" ? outfitAssets.right : outfitAssets.left;
      }

      if (this.lainElements.lainSprite.src !== spriteUrl) {
        this.lainElements.lainSprite.src = spriteUrl;
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
      this.moveDuringSugarRush();
    } else if (lainState.mode == "walk") {
      this.moveTowardTarget();
    } else {
      this.tryToStartWalking();
    }

    this.draw();
  }

  private moveToEventCenter() {
    const size = SPRITE_SIZE.event;
    const center = {
      x: (window.innerWidth - size) / 2,
      y: (window.innerHeight - size) / 2,
    };

    if (this.isWithinTargetRadius(center)) {
      this.finishMovement();
      return;
    }

    if (!this.startMovement(center)) return;

    this.moveToward(center);
  }

  private moveToward(target: Vector2) {
    const lainState = this.state;

    if (this.isWithinTargetRadius(target)) {
      this.finishMovement();
      return;
    }

    const displacement = subtract(target, lainState.position);
    const distance = magnitude(displacement);
    const step = scale(
      scale(displacement, 1.0 / distance),
      Math.min(lainState.speed, distance - TARGET_RADIUS),
    );

    lainState.velocity = step;
    lainState.position = add(lainState.position, step);

    if (step.x < 0) {
      this.facing = "left";
    } else if (step.x > 0) {
      this.facing = "right";
    }

    if (this.isWithinTargetRadius(target)) {
      this.finishMovement();
    }
  }

  private moveTowardTarget() {
    this.moveToward(this.state.target);
  }

  private moveDuringSugarRush() {
    const lainState = this.state;
    const maxX = Math.max(0, window.innerWidth - SPRITE_SIZE.normal);
    const maxY = Math.max(0, window.innerHeight - SPRITE_SIZE.normal);

    lainState.position = add(
      lainState.position,
      scale(lainState.velocity, 1.3),
    );

    if (lainState.position.x <= 0 || lainState.position.x >= maxX) {
      lainState.velocity.x *= -1;
    }

    if (lainState.position.y <= 0 || lainState.position.y >= maxY) {
      lainState.velocity.y *= -1;
    }

    lainState.position.x = Math.max(0, Math.min(lainState.position.x, maxX));
    lainState.position.y = Math.max(0, Math.min(lainState.position.y, maxY));
  }

  private tryToStartWalking() {
    const lainState = this.state;
    if (Date.now() < this.idleUntil) return;
    if (Math.random() >= 0.01) return;

    const angle = Math.random() * Math.PI * 2;
    const distance =
      WALK_MIN_DISTANCE +
      Math.random() * (WALK_RADIUS - WALK_MIN_DISTANCE);
    const maxX = Math.max(0, window.innerWidth - SPRITE_SIZE.normal);
    const maxY = Math.max(0, window.innerHeight - SPRITE_SIZE.normal);
    const unclampedTarget = {
      x: lainState.position.x + Math.cos(angle) * distance,
      y: lainState.position.y + Math.sin(angle) * distance,
    };
    const target = {
      x: Math.max(0, Math.min(unclampedTarget.x, maxX)),
      y: Math.max(0, Math.min(unclampedTarget.y, maxY)),
    };
    const targetDistance = magnitude(subtract(target, lainState.position));

    if (
      targetDistance <= TARGET_RADIUS ||
      targetDistance > WALK_RADIUS
    ) {
      return;
    }

    this.startMovement(target);
  }

  private triggerExpression() {
    const lainState = this.state;
    const lainElements = this.lainElements;

    if (!lainElements || lainState.eventActive) return;

    const expressionUrl =
      lainState.outfit === "bear" ? assets.misc.exp2 : assets.misc.exp1;

    lainElements.expression.src = expressionUrl;
    this.showTemporarily(lainElements.expression, 3000);
  }

  private triggerSpecialEvent(outfit: LainState["outfit"] = this.state.outfit) {
    const lainState = this.state;
    const lainElements = this.lainElements;

    if (!lainElements || lainState.eventActive || lainState.sugarRush) return;

    const eventAsset = assets[outfit]?.event;
    if (!eventAsset) return;

    const eventDurations: Partial<Record<LainState["outfit"], number>> = {
      bear: 8000,
      school: 3000,
      pink: 10000,
    };

    const duration = eventDurations[outfit] ?? 10000;
    const invocation = ++this.eventInvocation;
    this.cancelTimeout(this.eventTimeout);
    lainState.eventActive = true;
    lainElements.lainSprite.src = eventAsset;
    this.draw();

    const timeoutId = this.schedule(() => {
      if (this.eventInvocation !== invocation) return;

      this.eventTimeout = null;
      lainState.eventActive = false;
      this.finishMovement();
      this.draw();
    }, duration);
    this.eventTimeout = timeoutId;
  }

  private showTemporarily(lainElements: HTMLElement, duration: number) {
    const invocation = ++this.expressionInvocation;
    this.cancelTimeout(this.expressionTimeout);
    lainElements.style.opacity = "1";

    const timeoutId = this.schedule(() => {
      if (this.expressionInvocation !== invocation) return;

      this.expressionTimeout = null;
      lainElements.style.opacity = "0";
    }, duration);
    this.expressionTimeout = timeoutId;
  }

  private triggerSugarRush() {
    const lainState = this.state;
    if (lainState.eventActive) return;

    const randomSign = () => (Math.random() > 0.5 ? 1 : -1);
    const invocation = ++this.sugarRushInvocation;
    this.cancelTimeout(this.sugarRushTimeout);
    this.cancelMovementTimeout();
    this.movementTarget = null;
    this.movementTimedOut = false;
    lainState.mode = "idle";
    lainState.target = { ...lainState.position };
    lainState.sugarRush = true;
    lainState.velocity = scale(
      {
        x: randomSign(),
        y: randomSign(),
      },
      10,
    );

    const timeoutId = this.schedule(() => {
      if (this.sugarRushInvocation !== invocation) return;

      this.sugarRushTimeout = null;
      lainState.sugarRush = false;
      this.finishMovement();
    }, 5000);
    this.sugarRushTimeout = timeoutId;
  }

  private showDialogue(text?: string) {
    const lainElements = this.lainElements;
    if (!lainElements) return;

    const message =
      text ?? dialogues[Math.floor(Math.random() * dialogues.length)];
    const invocation = ++this.dialogueInvocation;
    this.cancelTimeout(this.dialogueTimeout);
    lainElements.bubble.textContent = message;
    lainElements.bubble.style.opacity = "1";

    const timeoutId = this.schedule(() => {
      if (this.dialogueInvocation !== invocation) return;

      this.dialogueTimeout = null;
      lainElements.bubble.style.opacity = "0";
    }, 4000);
    this.dialogueTimeout = timeoutId;
  }
}
