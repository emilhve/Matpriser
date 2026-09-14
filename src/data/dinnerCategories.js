export const dinnerCategoryGroups = {
  broad: [
    { id: 33, name: "Middag" },
    { id: 4, name: "Middagstilbehør" },
    { id: 43, name: "Kjøtt" },
    { id: 46, name: "Kylling og fjærkre" },
    { id: 105, name: "Fisk & skalldyr" },
    { id: 130, name: "Taco" },
    { id: 134, name: "Supper" },
    { id: 142, name: "Pasta" },
    { id: 115, name: "Ris" },
    { id: 6231, name: "Ferdigretter" }
  ],
  chicken: [
    { id: 354, name: "Kyllingfilet" },
    { id: 48, name: "Kyllinglår" },
    { id: 254, name: "Kylling hel" },
    { id: 622, name: "Kyllingvinger" },
    { id: 463, name: "Kyllingkjøttdeig" }
  ],
  meat: [
    { id: 169, name: "Kjøttdeig" },
    { id: 190, name: "Karbonadedeig" },
    { id: 173, name: "Svinekjøtt" },
    { id: 392, name: "Storfekjøtt" },
    { id: 456, name: "Kjøttboller" }
  ],
  fish: [
    { id: 108, name: "Laks" },
    { id: 182, name: "Torsk" },
    { id: 270, name: "Fiskekaker" },
    { id: 181, name: "Fiskegrateng" },
    { id: 472, name: "Fiskepinner" },
    { id: 791, name: "Fiskeboller" }
  ],
  pastaRiceTaco: [
    { id: 143, name: "Spagetti" },
    { id: 218, name: "Makaroni" },
    { id: 243, name: "Pasta fylt" },
    { id: 253, name: "Pastaskruer" },
    { id: 606, name: "Ris" },
    { id: 634, name: "Risottoris" },
    { id: 131, name: "Tacoskjell" },
    { id: 262, name: "Tortillalefser" },
    { id: 564, name: "Tacokit" }
  ],
  soups: [
    { id: 136, name: "Kyllingsuppe" },
    { id: 148, name: "Grønnsaksuppe" },
    { id: 337, name: "Tomatsuppe" },
    { id: 360, name: "Fiskesuppe" },
    { id: 434, name: "Kjøttsuppe" }
  ],
  readyMeals: [
    { id: 6245, name: "Ferdigmåltid" },
    { id: 6246, name: "Lasagne ferdig" },
    { id: 6247, name: "Pastarett ferdig" },
    { id: 6250, name: "Gryterett ferdig" },
    { id: 6272, name: "Taco ferdig" },
    { id: 6275, name: "Fiskemåltid ferdig" }
  ],
  excludedDessert: [
    { id: 164, name: "Dessert" },
    { id: 404, name: "Dessertis" },
    { id: 879, name: "Dessertsuppe" }
  ]
};

export const dinnerCategoryIds = Object.values(dinnerCategoryGroups)
  .flat()
  .filter((category) => !dinnerCategoryGroups.excludedDessert.includes(category))
  .map((category) => category.id);

export const dinnerCategoryById = new Map(
  Object.values(dinnerCategoryGroups)
    .flat()
    .map((category) => [category.id, category])
);
