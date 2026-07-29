import definePlugin from "@utils/types";
import { ApplicationCommandOptionType } from "@api/Commands";
import { LainPet } from "./classes/LainPet";

function startLain() {
  function spawnMisc(type: "crow" | "girl") {
    const item = document.createElement("img");
    item.src = assets.misc[type];
    const size = type === "crow" ? 120 : 100;
    item.style.cssText = `position:fixed; width:${size}px; z-index:9998; pointer-events:none; transition: left 8s linear; top: ${Math.random() * (window.innerHeight - size)}px;`;
    const startX = Math.random() < 0.5 ? -size : window.innerWidth + size;
    item.style.left = `${startX}px`;
    const movingRight = startX < 0;
    item.style.transform =
      type === "crow"
        ? movingRight
          ? "scaleX(1)"
          : "scaleX(-1)"
        : movingRight
          ? "scaleX(-1)"
          : "scaleX(1)";
    document.body.appendChild(item);
    setTimeout(() => {
      item.style.left = `${movingRight ? window.innerWidth + size : -size}px`;
    }, 100);
    setTimeout(() => item.remove(), 9000);
  }

  function dropNavi() {
    if (naviItem) return;
    const navi = document.createElement("img");
    navi.src = assets.misc.navi[Math.floor(Math.random() * 3)];
    navi.style.cssText = `position:fixed; width:120px; z-index:9997; pointer-events:none; transition: top 6s linear; top:-150px;`;
    navi.style.left = `${Math.random() * (window.innerWidth - 120)}px`;
    document.body.appendChild(navi);
    naviItem = navi;
    naviLanded = false;
    setTimeout(() => {
      navi.style.top = `${window.innerHeight - 150}px`;
    }, 100);
    setTimeout(() => {
      naviLanded = true;
    }, 6000);
    setTimeout(() => {
      if (naviItem === navi) {
        navi.remove();
        naviItem = null;
        naviLanded = false;
      }
    }, 15000);
  }

  intervals.push(setInterval(updatePhysics, 30));
  intervals.push(
    setInterval(() => {
      if (Math.random() < 0.2) showDialogue();
      if (Math.random() < 0.2) triggerExpression();
      if (Math.random() < 0.1) spawnMisc(Math.random() < 0.5 ? "crow" : "girl");
      if (Math.random() < 0.05) dropNavi();
    }, 15000),
  );

  intervals.push(
    setInterval(() => {
      const outfits = ["default", "school", "pink", "bear", "home"];
      const randomOutfit = outfits[Math.floor(Math.random() * outfits.length)];
      if (assets[randomOutfit as keyof typeof assets])
        state.outfit = randomOutfit;

      if (Math.random() < 0.4) {
        triggerSpecialEvent();
      }
    }, 60000),
  );
}

const lainPet = new LainPet();

export default definePlugin({
  name: "LainPet",
  description: "A cute Lain desktop pet for vendicated Vencord",
  authors: [
    {
      name: "realmxrza",
      id: "1348602887986745385",
    },
  ],

  commands: [
    {
      name: "lain",
      description: "Interact with your Lain pet",
      options: [
        {
          name: "action",
          description: "The action to perform",
          type: ApplicationCommandOptionType.STRING,
          required: true,
          choices: [
            { name: "Roll", value: "roll", displayName: "Roll" },
            { name: "Burn", value: "burn", displayName: "Burn" },
            { name: "Dance", value: "dance", displayName: "Dance" },
            { name: "Drop Navi", value: "navi", displayName: "Drop Navi" },
            {
              name: "Sugar Rush",
              value: "sugarrush",
              displayName: "Sugar Rush",
            },
            { name: "Spawn Crow", value: "crow", displayName: "Spawn Crow" },
            { name: "Spawn Girl", value: "girl", displayName: "Spawn Girl" },
            { name: "Express", value: "express", displayName: "Express" },
            { name: "Speak", value: "speak", displayName: "Speak" },
          ],
        },
        {
          name: "outfit",
          description:
            "Change outfit (only applies if action is omitted or irrelevant)",
          type: ApplicationCommandOptionType.STRING,
          required: false,
          choices: [
            { name: "Default", value: "default", displayName: "Default" },
            { name: "School", value: "school", displayName: "School" },
            { name: "Pink", value: "pink", displayName: "Pink" },
            { name: "Bear", value: "bear", displayName: "Bear" },
            { name: "Home", value: "home", displayName: "Home" },
          ],
        },
      ],
      execute: (args) => {
        if (!lainGlobal) return { content: "Lain pet is not running!" };

        const action = args.find((a) => a.name === "action")?.value;
        const outfit = args.find((a) => a.name === "outfit")?.value;

        if (outfit) lainGlobal.setOutfit(outfit);

        switch (action) {
          case "roll":
            lainGlobal.forceRoll();
            break;
          case "burn":
            lainGlobal.forceBurn();
            break;
          case "dance":
            lainGlobal.forceDance();
            break;
          case "navi":
            lainGlobal.dropNavi();
            break;
          case "sugarrush":
            lainGlobal.sugarRush();
            break;
          case "crow":
            lainGlobal.spawnCrow();
            break;
          case "girl":
            lainGlobal.spawnGirl();
            break;
          case "express":
            lainGlobal.express();
            break;
          case "speak":
            lainGlobal.speak();
            break;
        }
      },
    },
  ],

  start() {
    lainPet.start();
    console.log(
      "%c Lain Pet Plugin Started ",
      "background: #000; color: #f0f; font-weight: bold; font-size: 14px;",
    );
  },

  stop() {
    lainPet.stop();
    console.log(
      "%c Lain Pet Plugin Stopped ",
      "background: #000; color: #f0f; font-weight: bold; font-size: 14px;",
    );
  },
});
