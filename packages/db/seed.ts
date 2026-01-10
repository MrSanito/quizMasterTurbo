import { prisma } from "./lib/index";

async function main() {
  console.log("🚀 Seeding Science Category...");

  // Helper to shuffle options and track the correct answer index automatically
  const shuffleAndFormat = (
    qText: string,
    opts: string[],
    correctIdx: number
  ) => {
    const correctValue = opts[correctIdx];
    const shuffled = [...opts].sort(() => Math.random() - 0.5);
    const newCorrectIdx = shuffled.indexOf(correctValue);

    return {
      questionText: qText,
      points: 4,
      negativePoints: -1,
      options: {
        create: shuffled.map((opt, i) => ({
          text: opt,
          isCorrect: i === newCorrectIdx,
        })),
      },
    };
  };

  const scienceData = [
    {
      quizNumber: 7,
      quizTitle: "Physics – Light & Sound",
      questions: [
        [
          "Speed of light in vacuum?",
          ["3×10^8 m/s", "3×10^6 m/s", "3×10^5 km/s", "3×10^3 m/s"],
          0,
        ],
        [
          "Mirror that forms virtual image only?",
          ["Concave", "Convex", "Plane", "Cylindrical"],
          2,
        ],
        [
          "Image formed by plane mirror is?",
          ["Real", "Inverted", "Virtual & erect", "Magnified"],
          2,
        ],
        [
          "Concave mirror is used in?",
          ["Rear-view mirror", "Torch", "Side mirror", "Periscope"],
          1,
        ],
        [
          "Convex mirror is used as?",
          [
            "Shaving mirror",
            "Torch reflector",
            "Rear-view mirror",
            "Magnifying glass",
          ],
          2,
        ],
        ["Unit of frequency?", ["Meter", "Second", "Hertz", "Decibel"], 2],
        ["Sound needs which medium?", ["Vacuum", "Medium", "Light", "Heat"], 1],
        [
          "Human audible range?",
          ["10–1000 Hz", "20–20000 Hz", "100–10000 Hz", "1–100 Hz"],
          1,
        ],
        [
          "Echo is due to?",
          ["Reflection of sound", "Refraction", "Diffraction", "Absorption"],
          0,
        ],
        [
          "Speed of sound is fastest in?",
          ["Gas", "Liquid", "Solid", "Vacuum"],
          2,
        ],
        [
          "Loudness depends on?",
          ["Frequency", "Amplitude", "Speed", "Wavelength"],
          1,
        ],
        ["Pitch depends on?", ["Amplitude", "Frequency", "Speed", "Echo"], 1],
        [
          "Periscope works on?",
          ["Refraction", "Reflection", "Diffraction", "Dispersion"],
          1,
        ],
        [
          "Rainbow is due to?",
          ["Reflection", "Refraction", "Dispersion", "Diffraction"],
          2,
        ],
        ["Unit of loudness?", ["Hertz", "Decibel", "Watt", "Joule"], 1],
      ],
    },

    {
      quizNumber: 8,
      quizTitle: "Physics – Electricity & Magnetism",
      questions: [
        ["SI unit of electric current?", ["Volt", "Ohm", "Ampere", "Watt"], 2],
        [
          "Flow of electrons is called?",
          ["Voltage", "Current", "Resistance", "Power"],
          1,
        ],
        ["SI unit of voltage?", ["Ampere", "Volt", "Ohm", "Watt"], 1],
        ["SI unit of resistance?", ["Ohm", "Volt", "Ampere", "Joule"], 0],
        ["Ohm’s law states?", ["V=IR", "P=VI", "E=mc²", "F=ma"], 0],
        [
          "Device to measure current?",
          ["Voltmeter", "Ammeter", "Ohmmeter", "Galvanometer"],
          1,
        ],
        ["Ammeter connected in?", ["Parallel", "Series", "Either", "None"], 1],
        [
          "Voltmeter connected in?",
          ["Series", "Parallel", "Either", "None"],
          1,
        ],
        [
          "Electric fuse made of?",
          ["Copper", "Aluminum", "Low melting alloy", "Iron"],
          2,
        ],
        [
          "Short circuit causes?",
          ["Low current", "High current", "No current", "Constant current"],
          1,
        ],
        ["Magnet has how many poles?", ["1", "2", "3", "4"], 1],
        ["Like poles?", ["Attract", "Repel", "Neutralize", "Disappear"], 1],
        [
          "Earth behaves like?",
          ["Bar magnet", "Ring magnet", "Electromagnet", "No magnet"],
          0,
        ],
        [
          "Electromagnet uses?",
          ["Permanent magnet", "Electric current", "Heat", "Light"],
          1,
        ],
        [
          "Electric bell works on?",
          ["Sound energy", "Magnetism", "Electromagnetism", "Heat"],
          2,
        ],
      ],
    },

    {
      quizNumber: 9,
      quizTitle: "Chemistry – Atoms & Molecules",
      questions: [
        [
          "Smallest particle of matter?",
          ["Atom", "Molecule", "Ion", "Electron"],
          0,
        ],
        [
          "Who proposed atomic theory?",
          ["Bohr", "Dalton", "Rutherford", "Thomson"],
          1,
        ],
        ["Symbol of sodium?", ["So", "Na", "Sn", "Sd"], 1],
        ["Chemical formula of water?", ["H₂O", "HO₂", "H₂O₂", "OH"], 0],
        [
          "Atomic number equals number of?",
          ["Neutrons", "Protons", "Electrons", "Both protons & electrons"],
          3,
        ],
        [
          "Mass number equals?",
          ["Protons", "Neutrons", "Protons + neutrons", "Electrons"],
          2,
        ],
        [
          "Isotopes have same?",
          ["Mass number", "Atomic number", "Neutrons", "Mass"],
          1,
        ],
        ["Molecule of oxygen?", ["O", "O₂", "O₃", "O₄"], 1],
        [
          "Avogadro number is?",
          ["6.02×10²²", "6.02×10²³", "6.02×10²⁴", "6.02×10²¹"],
          1,
        ],
        [
          "Ion with positive charge?",
          ["Anion", "Cation", "Neutral", "Radical"],
          1,
        ],
        ["Loss of electron forms?", ["Anion", "Cation", "Atom", "Molecule"], 1],
        ["Gain of electron forms?", ["Cation", "Anion", "Isotope", "Atom"], 1],
        [
          "Law of conservation of mass by?",
          ["Dalton", "Lavoisier", "Bohr", "Einstein"],
          1,
        ],
        [
          "1 mole of substance contains?",
          ["Atoms", "Molecules", "6.02×10²³ particles", "Electrons"],
          2,
        ],
        [
          "Chemical equations should be?",
          ["Unbalanced", "Balanced", "Random", "Incomplete"],
          1,
        ],
      ],
    },

    {
      quizNumber: 10,
      quizTitle: "Chemistry – Metals & Non-Metals",
      questions: [
        [
          "Metal that is liquid at room temperature?",
          ["Iron", "Mercury", "Sodium", "Aluminum"],
          1,
        ],
        [
          "Best conductor of electricity?",
          ["Copper", "Silver", "Iron", "Aluminum"],
          1,
        ],
        [
          "Non-metal that conducts electricity?",
          ["Sulphur", "Carbon (graphite)", "Phosphorus", "Oxygen"],
          1,
        ],
        ["Rusting occurs due to?", ["CO₂", "O₂ & moisture", "H₂", "N₂"], 1],
        ["Iron rust is?", ["FeO", "Fe₂O₃", "Fe₂O₃·xH₂O", "Fe₃O₄"], 2],
        [
          "Metal used for electrical wires?",
          ["Iron", "Copper", "Zinc", "Lead"],
          1,
        ],
        ["Sodium stored in?", ["Water", "Oil", "Air", "Acid"], 1],
        [
          "Non-metals are generally?",
          ["Malleable", "Ductile", "Brittle", "Magnetic"],
          2,
        ],
        ["Metal oxides are?", ["Acidic", "Basic", "Neutral", "Salty"], 1],
        [
          "Non-metal oxides are?",
          ["Basic", "Acidic", "Neutral", "Alkaline"],
          1,
        ],
        [
          "Corrosion of silver forms?",
          [
            "Silver chloride",
            "Silver sulphide",
            "Silver oxide",
            "Silver nitrate",
          ],
          1,
        ],
        ["Highly reactive metal?", ["Gold", "Silver", "Sodium", "Copper"], 2],
        ["Least reactive metal?", ["Iron", "Gold", "Zinc", "Aluminum"], 1],
        [
          "Alloy is?",
          ["Pure metal", "Metal + metal", "Metal + non-metal", "Mixture"],
          3,
        ],
        [
          "Brass is alloy of?",
          [
            "Copper & zinc",
            "Copper & tin",
            "Iron & carbon",
            "Aluminum & copper",
          ],
          0,
        ],
      ],
    },

    {
      quizNumber: 11,
      quizTitle: "Biology – Plant Physiology",
      questions: [
        [
          "Photosynthesis uses?",
          ["Oxygen", "Carbon dioxide", "Nitrogen", "Hydrogen"],
          1,
        ],
        ["Gas released during photosynthesis?", ["CO₂", "O₂", "N₂", "H₂"], 1],
        ["Chlorophyll gives color?", ["Red", "Yellow", "Green", "Blue"], 2],
        [
          "Photosynthesis occurs in?",
          ["Roots", "Stem", "Leaves", "Flowers"],
          2,
        ],
        [
          "Water absorbed by plants through?",
          ["Stem", "Leaves", "Roots", "Flowers"],
          2,
        ],
        ["Xylem transports?", ["Food", "Water", "Hormones", "Oxygen"], 1],
        ["Phloem transports?", ["Water", "Minerals", "Food", "Waste"], 2],
        [
          "Opening & closing of stomata controlled by?",
          ["Roots", "Guard cells", "Xylem", "Veins"],
          1,
        ],
        [
          "Transpiration occurs through?",
          ["Roots", "Stem", "Stomata", "Flowers"],
          2,
        ],
        [
          "Process of food making?",
          ["Respiration", "Photosynthesis", "Transpiration", "Germination"],
          1,
        ],
        [
          "Plants respire?",
          ["Only day", "Only night", "Both day & night", "Never"],
          2,
        ],
        [
          "Food stored in plants as?",
          ["Glucose", "Starch", "Sucrose", "Protein"],
          1,
        ],
        [
          "Main function of root?",
          [
            "Photosynthesis",
            "Support & absorption",
            "Reproduction",
            "Transpiration",
          ],
          1,
        ],
        ["Sunlight provides?", ["Heat", "Energy", "Water", "Oxygen"], 1],
        [
          "Minerals required by plants?",
          ["Nitrogen", "Phosphorus", "Potassium", "All"],
          3,
        ],
      ],
    },

    {
      quizNumber: 12,
      quizTitle: "Biology – Environment & Ecology",
      questions: [
        [
          "Study of environment?",
          ["Biology", "Ecology", "Geology", "Zoology"],
          1,
        ],
        [
          "Producers in ecosystem?",
          ["Animals", "Plants", "Fungi", "Bacteria"],
          1,
        ],
        [
          "Consumers are?",
          ["Plants", "Animals", "Producers", "Decomposers"],
          1,
        ],
        [
          "Decomposers include?",
          ["Plants", "Animals", "Bacteria & fungi", "Insects"],
          2,
        ],
        [
          "Food chain starts with?",
          ["Animals", "Plants", "Herbivores", "Carnivores"],
          1,
        ],
        ["Energy transfer in food chain is?", ["100%", "50%", "10%", "90%"], 2],
        [
          "Greenhouse gas?",
          ["Oxygen", "Nitrogen", "Carbon dioxide", "Hydrogen"],
          2,
        ],
        [
          "Deforestation causes?",
          ["Floods", "Soil erosion", "Climate change", "All"],
          3,
        ],
        [
          "Ozone layer protects from?",
          ["Infrared rays", "Visible light", "UV rays", "Gamma rays"],
          2,
        ],
        ["Pollution affecting air?", ["Noise", "Smoke", "Waste", "Plastic"], 1],
        [
          "Biodegradable waste?",
          ["Plastic", "Glass", "Vegetable waste", "Metal"],
          2,
        ],
        ["Non-biodegradable waste?", ["Paper", "Leaves", "Plastic", "Food"], 2],
        [
          "Conservation of environment means?",
          ["Usage", "Protection", "Exploitation", "Destruction"],
          1,
        ],
        [
          "National parks protect?",
          ["Cities", "Wildlife", "Factories", "Rivers only"],
          1,
        ],
        [
          "Reduce, Reuse, Recycle is related to?",
          ["Pollution", "Waste management", "Energy", "Transport"],
          1,
        ],
      ],
    },
    {
      quizNumber: 13,
      quizTitle: "Physics – Heat & Temperature",
      questions: [
        [
          "SI unit of temperature?",
          ["Celsius", "Kelvin", "Fahrenheit", "Joule"],
          1,
        ],
        ["Heat is a form of?", ["Matter", "Energy", "Force", "Power"], 1],
        [
          "Instrument to measure temperature?",
          ["Barometer", "Thermometer", "Hygrometer", "Anemometer"],
          1,
        ],
        ["Normal human body temperature?", ["35°C", "36°C", "37°C", "38°C"], 2],
        [
          "Heat transfer without medium?",
          ["Conduction", "Convection", "Radiation", "All"],
          2,
        ],
        ["Best conductor of heat?", ["Wood", "Plastic", "Copper", "Glass"], 2],
        ["Land breeze occurs at?", ["Day", "Night", "Evening", "Morning"], 1],
        [
          "Sea breeze occurs during?",
          ["Night", "Day", "Winter", "Rainy season"],
          1,
        ],
        [
          "Black surfaces are?",
          [
            "Good reflectors",
            "Poor absorbers",
            "Good absorbers",
            "Bad emitters",
          ],
          2,
        ],
        [
          "Clinical thermometer range?",
          ["0–100°C", "0–50°C", "35–42°C", "30–60°C"],
          2,
        ],
        [
          "Heat causes?",
          ["Expansion", "Contraction", "No change", "Cooling"],
          0,
        ],
        ["SI unit of heat?", ["Joule", "Calorie", "Watt", "Newton"], 0],
        ["Hot air is?", ["Heavier", "Lighter", "Same", "Solid"], 1],
        [
          "Conduction occurs mainly in?",
          ["Liquids", "Gases", "Solids", "Vacuum"],
          2,
        ],
        [
          "Radiation travels fastest in?",
          ["Air", "Water", "Vacuum", "Metal"],
          2,
        ],
      ],
    },

    {
      quizNumber: 14,
      quizTitle: "Physics – Gravitation & Space",
      questions: [
        [
          "Force that attracts objects?",
          ["Magnetic", "Electric", "Gravitational", "Frictional"],
          2,
        ],
        [
          "Acceleration due to gravity on Earth?",
          ["9.8 m/s²", "10 m/s²", "8.9 m/s²", "9.8 km/s²"],
          0,
        ],
        ["SI unit of weight?", ["kg", "Newton", "Joule", "Watt"], 1],
        ["Weight depends on?", ["Mass", "Gravity", "Volume", "Density"], 1],
        [
          "Mass remains?",
          ["Same everywhere", "Changes", "Zero", "Infinite"],
          0,
        ],
        ["Planet closest to Sun?", ["Earth", "Venus", "Mercury", "Mars"], 2],
        ["Largest planet?", ["Earth", "Saturn", "Jupiter", "Neptune"], 2],
        ["Red planet?", ["Venus", "Mars", "Jupiter", "Mercury"], 1],
        ["Moon is a?", ["Planet", "Star", "Satellite", "Comet"], 2],
        [
          "Time taken by Earth to revolve around Sun?",
          ["24 hours", "30 days", "365 days", "12 hours"],
          2,
        ],
        [
          "Galaxy containing Earth?",
          ["Andromeda", "Milky Way", "Whirlpool", "Orion"],
          1,
        ],
        [
          "Stars produce energy by?",
          ["Combustion", "Fission", "Fusion", "Radiation"],
          2,
        ],
        [
          "Artificial satellite used for communication?",
          ["INSAT", "IRS", "PSLV", "GSLV"],
          0,
        ],
        [
          "First man on Moon?",
          ["Yuri Gagarin", "Neil Armstrong", "Buzz Aldrin", "Michael Collins"],
          1,
        ],
        [
          "ISRO stands for?",
          [
            "Indian Space Research Organisation",
            "International Space Research Org",
            "Indian Satellite Research Org",
            "International Satellite Research Org",
          ],
          0,
        ],
      ],
    },

    {
      quizNumber: 15,
      quizTitle: "Chemistry – Carbon & Its Compounds",
      questions: [
        ["Atomic number of carbon?", ["6", "8", "12", "14"], 0],
        [
          "Carbon shows property of?",
          ["Ionic bonding", "Covalent bonding", "Metallic bonding", "None"],
          1,
        ],
        [
          "Allotropes of carbon?",
          [
            "Coal & petrol",
            "Diamond & graphite",
            "Charcoal & gas",
            "Plastic & rubber",
          ],
          1,
        ],
        ["Diamond is?", ["Soft", "Hard", "Liquid", "Gas"], 1],
        ["Graphite is used in?", ["Jewelry", "Lubricant", "Fuel", "Paint"], 1],
        [
          "Hydrocarbons contain?",
          [
            "Carbon & oxygen",
            "Carbon & hydrogen",
            "Hydrogen & oxygen",
            "Nitrogen & carbon",
          ],
          1,
        ],
        [
          "Saturated hydrocarbons are?",
          ["Alkenes", "Alkynes", "Alkanes", "Alcohols"],
          2,
        ],
        [
          "Unsaturated hydrocarbons have?",
          ["Single bond", "Double/triple bond", "No bond", "Ionic bond"],
          1,
        ],
        ["Ethanol chemical formula?", ["CH₃OH", "C₂H₅OH", "CH₄", "C₂H₆"], 1],
        [
          "Ethanoic acid is?",
          ["Alcohol", "Aldehyde", "Carboxylic acid", "Ketone"],
          2,
        ],
        [
          "Soap is made by process called?",
          ["Oxidation", "Reduction", "Saponification", "Combustion"],
          2,
        ],
        [
          "Detergents work in?",
          ["Hard water", "Soft water", "Only rain water", "Only river water"],
          0,
        ],
        [
          "Carbon forms long chains due to?",
          ["Isomerism", "Catenation", "Valency", "Combustion"],
          1,
        ],
        [
          "Petroleum is?",
          ["Renewable", "Non-renewable", "Inexhaustible", "Unlimited"],
          1,
        ],
        [
          "CNG is?",
          ["Liquid fuel", "Solid fuel", "Gaseous fuel", "Nuclear fuel"],
          2,
        ],
      ],
    },

    {
      quizNumber: 16,
      quizTitle: "Biology – Life Processes",
      questions: [
        [
          "Process of taking food?",
          ["Respiration", "Digestion", "Nutrition", "Excretion"],
          2,
        ],
        [
          "Photosynthesis occurs in?",
          ["Roots", "Stem", "Leaves", "Flowers"],
          2,
        ],
        [
          "Breaking down of food is?",
          ["Nutrition", "Digestion", "Respiration", "Excretion"],
          1,
        ],
        [
          "Oxygen is used in?",
          ["Photosynthesis", "Respiration", "Transpiration", "Excretion"],
          1,
        ],
        [
          "Energy released in respiration is stored as?",
          ["Heat", "ATP", "Oxygen", "Carbon dioxide"],
          1,
        ],
        [
          "Breathing is?",
          ["Chemical process", "Physical process", "Both", "None"],
          1,
        ],
        [
          "Food pipe is called?",
          ["Trachea", "Oesophagus", "Bronchus", "Intestine"],
          1,
        ],
        ["Blood transports?", ["Oxygen", "Food", "Waste", "All"], 3],
        [
          "Waste removal process?",
          ["Nutrition", "Respiration", "Excretion", "Circulation"],
          2,
        ],
        ["Plants take CO₂ through?", ["Roots", "Stem", "Stomata", "Xylem"], 2],
        ["Human heart chambers?", ["2", "3", "4", "5"], 2],
        [
          "Respiration in plants occurs?",
          ["Only day", "Only night", "Both day & night", "Never"],
          2,
        ],
        [
          "Excretory organ in humans?",
          ["Liver", "Kidney", "Lungs", "Heart"],
          1,
        ],
        [
          "Main function of small intestine?",
          ["Digestion", "Absorption", "Excretion", "Respiration"],
          1,
        ],
        [
          "Anaerobic respiration produces?",
          ["Oxygen", "Lactic acid/alcohol", "ATP only", "CO₂ only"],
          1,
        ],
      ],
    },

    {
      quizNumber: 17,
      quizTitle: "Biology – Reproduction & Heredity",
      questions: [
        [
          "Reproduction is necessary for?",
          ["Energy", "Growth", "Continuity of species", "Food"],
          2,
        ],
        [
          "Human reproduction is?",
          ["Asexual", "Sexual", "Vegetative", "Binary"],
          1,
        ],
        ["Male reproductive cell?", ["Ovum", "Zygote", "Sperm", "Embryo"], 2],
        ["Female reproductive cell?", ["Sperm", "Ovum", "Zygote", "Foetus"], 1],
        [
          "Fusion of gametes called?",
          ["Fertilization", "Pollination", "Germination", "Reproduction"],
          0,
        ],
        [
          "Genetic material in cells?",
          ["Protein", "RNA", "DNA", "Carbohydrate"],
          2,
        ],
        ["Unit of heredity?", ["Cell", "Chromosome", "Gene", "Nucleus"], 2],
        [
          "Traits passed from?",
          ["Parents to offspring", "Environment", "Food", "Friends"],
          0,
        ],
        [
          "Gregor Mendel known as?",
          [
            "Father of biology",
            "Father of genetics",
            "Father of evolution",
            "Father of cell",
          ],
          1,
        ],
        [
          "Tallness in pea plant is?",
          ["Recessive", "Dominant", "Neutral", "Linked"],
          1,
        ],
        ["Chromosomes present in humans?", ["23", "46", "44", "22"], 1],
        [
          "Sex of child determined by?",
          ["Mother", "Father", "Both", "Environment"],
          1,
        ],
        [
          "Asexual reproduction occurs in?",
          ["Humans", "Dogs", "Amoeba", "Birds"],
          2,
        ],
        ["Binary fission seen in?", ["Hydra", "Amoeba", "Yeast", "Plants"], 1],
        [
          "Vegetative propagation occurs in?",
          ["Animals", "Plants", "Bacteria", "Viruses"],
          1,
        ],
      ],
    },

    {
      quizNumber: 18,
      quizTitle: "Everyday Science & Scientific Instruments",
      questions: [
        [
          "Barometer measures?",
          ["Temperature", "Pressure", "Humidity", "Speed"],
          1,
        ],
        [
          "Anemometer measures?",
          ["Wind speed", "Rainfall", "Pressure", "Temperature"],
          0,
        ],
        ["Hygrometer measures?", ["Humidity", "Speed", "Heat", "Pressure"], 0],
        ["Speedometer measures?", ["Distance", "Speed", "Time", "Force"], 1],
        [
          "Lactometer used for?",
          ["Milk purity", "Blood pressure", "Sound", "Heat"],
          0,
        ],
        [
          "Thermometer measures?",
          ["Heat", "Temperature", "Energy", "Pressure"],
          1,
        ],
        [
          "Optical fiber works on?",
          [
            "Reflection",
            "Refraction",
            "Total internal reflection",
            "Dispersion",
          ],
          2,
        ],
        [
          "Fuel used in LPG?",
          ["Petrol", "Butane & propane", "Diesel", "Kerosene"],
          1,
        ],
        [
          "CNG stands for?",
          [
            "Compressed Natural Gas",
            "Chemical Natural Gas",
            "Compressed Nitrogen Gas",
            "Carbon Natural Gas",
          ],
          0,
        ],
        [
          "LED stands for?",
          [
            "Light Emitting Diode",
            "Low Energy Device",
            "Light Energy Diode",
            "Laser Emitting Device",
          ],
          0,
        ],
        [
          "Solar cooker uses?",
          ["Reflection", "Refraction", "Greenhouse effect", "Conduction"],
          2,
        ],
        [
          "Vaccination provides?",
          ["Immediate cure", "Immunity", "Nutrition", "Growth"],
          1,
        ],
        ["Pasteurization related to?", ["Milk", "Water", "Air", "Blood"], 0],
        [
          "Recycling helps in?",
          [
            "Pollution increase",
            "Resource saving",
            "Waste increase",
            "Energy loss",
          ],
          1,
        ],
        [
          "First aid is?",
          ["Treatment", "Temporary help", "Medicine", "Surgery"],
          1,
        ],
      ],
    },
    {
      quizNumber: 19,
      quizTitle: "Health, Diseases & Nutrition",
      questions: [
        [
          "Balanced diet contains?",
          [
            "Only carbohydrates",
            "Only proteins",
            "All nutrients in right amount",
            "Only vitamins",
          ],
          2,
        ],
        [
          "Deficiency of vitamin A causes?",
          ["Scurvy", "Rickets", "Night blindness", "Beriberi"],
          2,
        ],
        [
          "Vitamin C deficiency causes?",
          ["Rickets", "Scurvy", "Anemia", "Goitre"],
          1,
        ],
        [
          "Vitamin D deficiency causes?",
          ["Scurvy", "Rickets", "Night blindness", "Beriberi"],
          1,
        ],
        [
          "Disease caused by bacteria?",
          ["Malaria", "Tuberculosis", "Polio", "Chickenpox"],
          1,
        ],
        [
          "Disease caused by virus?",
          ["Typhoid", "Cholera", "Polio", "Tetanus"],
          2,
        ],
        [
          "Malaria is caused by?",
          ["Virus", "Bacteria", "Protozoa", "Fungus"],
          2,
        ],
        [
          "Carrier of malaria?",
          ["Housefly", "Anopheles mosquito", "Culex mosquito", "Sandfly"],
          1,
        ],
        [
          "Anemia caused by deficiency of?",
          ["Calcium", "Iron", "Iodine", "Vitamin D"],
          1,
        ],
        [
          "Goitre caused by deficiency of?",
          ["Iron", "Iodine", "Calcium", "Vitamin C"],
          1,
        ],
        [
          "Which mineral helps in blood clotting?",
          ["Iron", "Calcium", "Sodium", "Potassium"],
          1,
        ],
        [
          "Communicable diseases spread by?",
          ["Food", "Air", "Water", "All"],
          3,
        ],
        [
          "Non-communicable disease?",
          ["Malaria", "Tuberculosis", "Diabetes", "Cholera"],
          2,
        ],
        [
          "Vaccines help in?",
          [
            "Curing disease",
            "Preventing disease",
            "Increasing pain",
            "Causing fever",
          ],
          1,
        ],
        ["BMI relates to?", ["Height", "Weight", "Health status", "Age"], 2],
      ],
    },

    {
      quizNumber: 20,
      quizTitle: "Natural Resources, Pollution & Sustainability",
      questions: [
        [
          "Renewable resource?",
          ["Coal", "Petroleum", "Wind", "Natural gas"],
          2,
        ],
        ["Non-renewable resource?", ["Sunlight", "Wind", "Coal", "Water"], 2],
        [
          "Main source of energy on Earth?",
          ["Coal", "Electricity", "Sun", "Wind"],
          2,
        ],
        [
          "Fossil fuels formed from?",
          ["Rocks", "Dead plants & animals", "Water", "Minerals"],
          1,
        ],
        [
          "Major cause of air pollution?",
          ["Trees", "Vehicles", "Rain", "Oxygen"],
          1,
        ],
        [
          "Water pollution caused by?",
          ["Industrial waste", "Sewage", "Chemicals", "All"],
          3,
        ],
        [
          "Soil erosion occurs due to?",
          [
            "Afforestation",
            "Deforestation",
            "Rainwater harvesting",
            "Irrigation",
          ],
          1,
        ],
        ["Acid rain damages?", ["Soil", "Crops", "Buildings", "All"], 3],
        [
          "Global warming caused by?",
          ["Oxygen", "Greenhouse gases", "Nitrogen", "Hydrogen"],
          1,
        ],
        [
          "Gas responsible for global warming?",
          ["Oxygen", "Nitrogen", "Carbon dioxide", "Helium"],
          2,
        ],
        ["Ozone layer depletion caused by?", ["CO₂", "CFCs", "O₂", "SO₂"], 1],
        [
          "3R principle stands for?",
          [
            "Reduce, Reuse, Recycle",
            "Recover, Reuse, Repair",
            "Reduce, Repair, Recycle",
            "Reuse, Refill, Reduce",
          ],
          0,
        ],
        [
          "Sustainable development means?",
          [
            "Using all resources",
            "Development without harming future",
            "Fast growth",
            "No development",
          ],
          1,
        ],
        [
          "Rainwater harvesting helps in?",
          ["Flooding", "Water conservation", "Pollution", "Evaporation"],
          1,
        ],
        [
          "Best way to conserve resources?",
          ["Overuse", "Reuse & recycle", "Throw away", "Burn"],
          1,
        ],
      ],
    },
  ];

  const historyData = [
    {
      quizNumber: 1,
      title: "Ancient India – Indus Valley",
      questions: [
        [
          "Indus Valley Civilization belongs to which age?",
          ["Stone Age", "Bronze Age", "Iron Age", "Copper Age"],
          1,
        ],
        [
          "Largest site of Indus Valley Civilization?",
          ["Harappa", "Mohenjo-daro", "Dholavira", "Lothal"],
          2,
        ],
        [
          "Great Bath is located at?",
          ["Harappa", "Mohenjo-daro", "Kalibangan", "Banawali"],
          1,
        ],
        [
          "Indus Valley script is?",
          ["Deciphered", "Partially deciphered", "Undeciphered", "Greek"],
          2,
        ],
        [
          "Main occupation of Indus people?",
          ["Hunting", "Agriculture", "Fishing", "Trade only"],
          1,
        ],
        [
          "Town planning was based on?",
          ["Circular pattern", "Grid system", "Random layout", "River based"],
          1,
        ],
        [
          "Indus bricks were made of?",
          ["Stone", "Mud", "Baked bricks", "Wood"],
          2,
        ],
        [
          "Dockyard found at?",
          ["Lothal", "Dholavira", "Harappa", "Rakhigarhi"],
          0,
        ],
        [
          "Which animal seal is most common?",
          ["Horse", "Bull", "Unicorn", "Elephant"],
          2,
        ],
        [
          "Indus Valley people worshipped?",
          ["Fire", "Nature", "Mother Goddess", "Sun"],
          2,
        ],
        ["Which metal was unknown?", ["Gold", "Silver", "Iron", "Copper"], 2],
        [
          "Harappan drainage system was?",
          ["Poor", "Excellent", "Average", "Absent"],
          1,
        ],
        [
          "Indus Valley economy based on?",
          ["Trade", "Agriculture", "Pastoralism", "Hunting"],
          1,
        ],
        [
          "Indus Valley houses had?",
          ["Mud floors", "No drains", "Private wells", "Thatched roofs"],
          2,
        ],
        [
          "End of civilization caused by?",
          ["Floods", "Invasions", "Climate change", "All of these"],
          3,
        ],
      ],
    },
    {
      quizNumber: 2,
      title: "Vedic Age",
      questions: [
        [
          "Early Vedic people were mainly?",
          ["Farmers", "Pastoralists", "Traders", "Artisans"],
          1,
        ],
        ["Rigveda is written in?", ["Prakrit", "Sanskrit", "Pali", "Tamil"], 1],
        ["Total mandalas in Rigveda?", ["8", "9", "10", "12"], 2],
        [
          "Sabha and Samiti were?",
          ["Taxes", "Assemblies", "Taxes officers", "Courts"],
          1,
        ],
        [
          "Later Vedic economy based on?",
          ["Trade", "Agriculture", "Pastoralism", "Fishing"],
          1,
        ],
        [
          "Varna system includes?",
          ["2 varnas", "3 varnas", "4 varnas", "5 varnas"],
          2,
        ],
        [
          "Upanishads deal with?",
          ["Rituals", "Philosophy", "Warfare", "Trade"],
          1,
        ],
        ["King was assisted by?", ["Mantri", "Purohit", "Senani", "All"], 3],
        [
          "Ashvamedha yajna related to?",
          ["Peace", "Kingship", "Marriage", "Agriculture"],
          1,
        ],
        [
          "Iron known as?",
          ["Krishna Ayas", "Shyam Ayas", "Lohit Ayas", "Tamra Ayas"],
          0,
        ],
        [
          "Main gods of early Vedic age?",
          [
            "Vishnu & Shiva",
            "Indra & Agni",
            "Brahma & Vishnu",
            "Surya & Chandra",
          ],
          1,
        ],
        [
          "Education system was?",
          ["Gurukul", "University", "Monastery", "School"],
          0,
        ],
        [
          "Position of women in early Vedic age?",
          ["Low", "Equal", "Very low", "Slavery"],
          1,
        ],
        [
          "Later Vedic society became?",
          ["Flexible", "Rigid", "Nomadic", "Tribal"],
          1,
        ],
        ["Language of Vedas?", ["Hindi", "Sanskrit", "Pali", "Persian"], 1],
      ],
    },
    {
      quizNumber: 3,
      title: "Maurya Empire",
      questions: [
        [
          "Founder of Maurya Empire?",
          ["Ashoka", "Bindusara", "Chandragupta Maurya", "Bimbisara"],
          2,
        ],
        [
          "Capital of Maurya Empire?",
          ["Taxila", "Ujjain", "Patliputra", "Kausambi"],
          2,
        ],
        [
          "Guide of Chandragupta Maurya?",
          ["Ashoka", "Chanakya", "Panini", "Megasthenes"],
          1,
        ],
        [
          "Book Arthashastra written by?",
          ["Ashoka", "Chanakya", "Kalidasa", "Panini"],
          1,
        ],
        [
          "Ashoka embraced Buddhism after?",
          ["Birth of son", "Kalinga war", "Coronation", "Meditation"],
          1,
        ],
        ["Kalinga war fought in?", ["261 BC", "250 BC", "270 BC", "300 BC"], 0],
        [
          "Ashoka inscriptions were written in?",
          ["Sanskrit", "Prakrit", "Pali", "Tamil"],
          1,
        ],
        [
          "Ashoka pillars are made of?",
          ["Granite", "Sandstone", "Marble", "Limestone"],
          1,
        ],
        ["Dhamma was related to?", ["Law", "Religion", "Ethics", "War"], 2],
        [
          "Maurya administration was?",
          ["Decentralized", "Centralized", "Feudal", "Tribal"],
          1,
        ],
        [
          "Megasthenes wrote?",
          ["Indica", "Arthashastra", "Mahavamsa", "Rajatarangini"],
          0,
        ],
        [
          "Ashoka sent missionaries to?",
          ["China", "Sri Lanka", "Japan", "Persia"],
          1,
        ],
        [
          "Symbol of Indian state comes from?",
          ["Gupta coins", "Ashoka pillar", "Mughal flag", "Vedic texts"],
          1,
        ],
        [
          "Maurya army included?",
          ["Only infantry", "Elephants", "Cavalry", "All"],
          3,
        ],
        [
          "End of Maurya dynasty due to?",
          ["Weak rulers", "Foreign invasion", "Revolts", "All"],
          3,
        ],
      ],
    },
    {
      quizNumber: 4,
      title: "Gupta Empire",
      questions: [
        [
          "Founder of Gupta dynasty?",
          ["Samudragupta", "Chandragupta I", "Skandagupta", "Kumaragupta"],
          1,
        ],
        [
          "Gupta period known as?",
          ["Dark age", "Golden age", "Iron age", "Silver age"],
          1,
        ],
        [
          "Samudragupta was famous for?",
          ["Administration", "Conquests", "Architecture", "Trade"],
          1,
        ],
        [
          "Allahabad pillar inscription belongs to?",
          ["Chandragupta I", "Samudragupta", "Skandagupta", "Harsha"],
          1,
        ],
        [
          "Gupta coins were mainly made of?",
          ["Silver", "Copper", "Gold", "Iron"],
          2,
        ],
        [
          "Nalanda University flourished during?",
          ["Maurya", "Gupta", "Mughal", "Delhi Sultanate"],
          1,
        ],
        [
          "Kalidasa belonged to?",
          ["Maurya age", "Gupta age", "Vedic age", "Mughal age"],
          1,
        ],
        [
          "Famous Gupta ruler Vikramaditya was?",
          ["Chandragupta II", "Samudragupta", "Skandagupta", "Harsha"],
          0,
        ],
        [
          "Gupta administration was?",
          ["Centralized", "Decentralized", "Military rule", "Tribal"],
          1,
        ],
        [
          "Iron pillar is rust free due to?",
          ["Magic", "Alloy", "Technique", "Climate"],
          2,
        ],
        [
          "Chinese traveller Fa-Hien visited during?",
          ["Ashoka", "Chandragupta II", "Harsha", "Kanishka"],
          1,
        ],
        [
          "Gupta art is seen in?",
          ["Ajanta caves", "Ellora caves", "Elephanta caves", "Karli caves"],
          0,
        ],
        [
          "Gupta period education focused on?",
          ["Religion", "Science", "Both", "War"],
          2,
        ],
        [
          "Decline of Guptas due to?",
          ["Huns invasion", "Weak rulers", "Economic issues", "All"],
          3,
        ],
        [
          "Decimal system developed in?",
          ["Maurya", "Gupta", "Mughal", "Modern"],
          1,
        ],
      ],
    },
    {
      quizNumber: 5,
      title: "Harsha & Post-Gupta India",
      questions: [
        ["Harsha ruled from?", ["Delhi", "Kannauj", "Patliputra", "Ujjain"], 1],
        [
          "Harsha was defeated by?",
          ["Pulakesin II", "Chalukya I", "Vikramaditya", "Samudragupta"],
          0,
        ],
        [
          "Chinese traveler during Harsha reign?",
          ["Hiuen Tsang", "Fa-Hien", "Ibn Battuta", "Alberuni"],
          0,
        ],
        [
          "Harsha wrote?",
          ["Nagananda", "Abhijnanasakuntalam", "Meghaduta", "Mudrarakshasa"],
          0,
        ],
        [
          "Harsha followed which religion?",
          ["Hinduism", "Jainism", "Buddhism", "Islam"],
          2,
        ],
        [
          "Harsha empire was?",
          ["Highly centralized", "Highly decentralized", "Feudal", "Tribal"],
          1,
        ],
        [
          "Land grants increased during?",
          ["Maurya", "Gupta", "Post-Gupta", "Vedic"],
          2,
        ],
        [
          "Feudalism grew due to?",
          ["Trade", "Land grants", "War", "Religion"],
          1,
        ],
        [
          "Post-Gupta economy was?",
          ["Strong", "Declining", "Industrial", "Capitalist"],
          1,
        ],
        [
          "Administration depended on?",
          ["Kings", "Samantas", "Priests", "Merchants"],
          1,
        ],
        [
          "Village headman was called?",
          ["Grama Bhojaka", "Amatya", "Senapati", "Purohit"],
          0,
        ],
        [
          "Harsha assemblies held at?",
          ["Prayag", "Kannauj", "Nalanda", "Taxila"],
          0,
        ],
        [
          "Post-Gupta art mainly?",
          ["Declined", "Improved", "No change", "Western"],
          0,
        ],
        ["Harsha died without?", ["Army", "Wealth", "Successor", "Empire"], 2],
        [
          "After Harsha India became?",
          ["United", "Fragmented", "Colonized", "Stable"],
          1,
        ],
      ],
    },
    {
      quizNumber: 6,
      title: "Early Medieval India – Chalukyas & Pallavas",
      questions: [
        [
          "Founder of Chalukya dynasty?",
          ["Pulakesin I", "Pulakesin II", "Vikramaditya I", "Kirtivarman"],
          0,
        ],
        ["Capital of Chalukyas?", ["Vatapi", "Kanchi", "Madurai", "Badami"], 3],
        [
          "Pulakesin II defeated which ruler?",
          ["Harsha", "Ashoka", "Samudragupta", "Skandagupta"],
          0,
        ],
        ["Pallava capital was?", ["Kanchi", "Madurai", "Ujjain", "Badami"], 0],
        [
          "Famous Pallava ruler?",
          ["Mahendravarman I", "Pulakesin II", "Harsha", "Rajendra Chola"],
          0,
        ],
        [
          "Rock-cut temples at Mahabalipuram built by?",
          ["Pallavas", "Cholas", "Chalukyas", "Rashtrakutas"],
          0,
        ],
        [
          "Rathas at Mahabalipuram are called?",
          ["Pancha Rathas", "Sapta Rathas", "Nava Rathas", "Dasha Rathas"],
          0,
        ],
        [
          "Chalukya art is seen at?",
          ["Ajanta", "Ellora", "Badami", "Elephanta"],
          2,
        ],
        [
          "Pallavas patronized which language?",
          ["Prakrit", "Tamil", "Sanskrit", "Both Tamil & Sanskrit"],
          3,
        ],
        [
          "Chalukya-Pallava conflict was mainly over?",
          ["Trade", "Religion", "Territory", "Taxes"],
          2,
        ],
        [
          "Virupaksha temple is at?",
          ["Badami", "Pattadakal", "Kanchi", "Mahabalipuram"],
          1,
        ],
        [
          "Pattadakal is a UNESCO site for?",
          ["Fort", "Temples", "Caves", "Paintings"],
          1,
        ],
        [
          "Chalukyas followed?",
          ["Buddhism", "Jainism", "Hinduism", "Islam"],
          2,
        ],
        [
          "Pallava architecture style?",
          ["Dravidian", "Nagara", "Vesara", "Indo-Islamic"],
          0,
        ],
        [
          "End of Pallava power due to?",
          ["Cholas", "Chalukyas", "Rashtrakutas", "Mughals"],
          0,
        ],
      ],
    },
    {
      quizNumber: 7,
      title: "Rashtrakutas & Pratiharas",
      questions: [
        [
          "Founder of Rashtrakuta dynasty?",
          ["Dantidurga", "Govinda III", "Amoghavarsha", "Krishna I"],
          0,
        ],
        [
          "Capital of Rashtrakutas?",
          ["Manyakheta", "Ujjain", "Kannauj", "Badami"],
          0,
        ],
        [
          "Ellora Kailasa temple built by?",
          ["Cholas", "Pallavas", "Rashtrakutas", "Guptas"],
          2,
        ],
        [
          "Kailasa temple dedicated to?",
          ["Vishnu", "Shiva", "Brahma", "Buddha"],
          1,
        ],
        [
          "Amoghavarsha was a patron of?",
          ["War", "Literature", "Trade", "Expansion"],
          1,
        ],
        [
          "Tripartite struggle was for control of?",
          ["Delhi", "Ujjain", "Kannauj", "Patliputra"],
          2,
        ],
        [
          "Parties in Tripartite struggle?",
          [
            "Cholas, Pallavas, Cheras",
            "Rashtrakutas, Pratiharas, Palas",
            "Mauryas, Guptas, Harsha",
            "Mughals, Rajputs, Afghans",
          ],
          1,
        ],
        [
          "Pratiharas ruled mainly in?",
          ["South India", "Western India", "Northern India", "Eastern India"],
          2,
        ],
        [
          "Founder of Pratihara dynasty?",
          ["Nagabhata I", "Bhoja", "Mahipala", "Govinda"],
          0,
        ],
        [
          "Bhoja was ruler of?",
          ["Rashtrakutas", "Pratiharas", "Palas", "Cholas"],
          1,
        ],
        [
          "Rashtrakutas supported which religion?",
          [
            "Only Hinduism",
            "Only Jainism",
            "Both Hinduism & Jainism",
            "Buddhism",
          ],
          2,
        ],
        [
          "Palas ruled which region?",
          ["Deccan", "Bengal", "Punjab", "Gujarat"],
          1,
        ],
        [
          "Pala rulers patronized?",
          ["Hinduism", "Islam", "Buddhism", "Christianity"],
          2,
        ],
        [
          "Decline of Pratiharas due to?",
          ["Arab invasion", "Internal weakness", "Cholas", "Mughals"],
          1,
        ],
        [
          "Rashtrakuta art influence seen in?",
          [
            "North Indian temples",
            "Rock-cut architecture",
            "Mosques",
            "Stupas",
          ],
          1,
        ],
      ],
    },
    {
      quizNumber: 8,
      title: "Chola Empire",
      questions: [
        [
          "Founder of imperial Chola dynasty?",
          ["Vijayalaya", "Rajaraja I", "Rajendra I", "Karikala"],
          0,
        ],
        [
          "Capital of Cholas?",
          ["Madurai", "Thanjavur", "Kanchi", "Uraiyur"],
          1,
        ],
        [
          "Rajaraja I built?",
          [
            "Brihadeshwara Temple",
            "Meenakshi Temple",
            "Shore Temple",
            "Sun Temple",
          ],
          0,
        ],
        [
          "Brihadeshwara temple dedicated to?",
          ["Vishnu", "Shiva", "Brahma", "Murugan"],
          1,
        ],
        [
          "Rajendra Chola conquered?",
          ["Sri Lanka", "Maldives", "Ganga region", "All"],
          3,
        ],
        [
          "Chola administration famous for?",
          [
            "Central rule",
            "Village self-government",
            "Feudalism",
            "Military rule",
          ],
          1,
        ],
        [
          "Village assemblies were called?",
          ["Sabha", "Ur", "Nagaram", "All"],
          3,
        ],
        [
          "Chola navy was strong in?",
          ["Arabian Sea", "Bay of Bengal", "Indian Ocean", "Mediterranean"],
          2,
        ],
        [
          "Cholas followed which religion mainly?",
          ["Buddhism", "Jainism", "Shaivism", "Vaishnavism"],
          2,
        ],
        [
          "Chola bronze sculptures are famous for?",
          ["Buddha", "Nataraja", "Vishnu", "Durga"],
          1,
        ],
        [
          "Uttaramerur inscriptions relate to?",
          ["Army", "Taxes", "Local governance", "Religion"],
          2,
        ],
        [
          "Cholas promoted trade with?",
          ["China & SE Asia", "Europe", "Africa", "America"],
          0,
        ],
        [
          "Chola temples follow which style?",
          ["Nagara", "Dravidian", "Vesara", "Indo-Islamic"],
          1,
        ],
        [
          "Decline of Cholas due to?",
          ["Pandyas", "Hoysalas", "Chalukyas", "All"],
          3,
        ],
        [
          "Chola period economy based on?",
          ["Agriculture", "Trade", "Crafts", "All"],
          3,
        ],
      ],
    },
    {
      quizNumber: 9,
      title: "Delhi Sultanate – Foundation",
      questions: [
        [
          "Founder of Delhi Sultanate?",
          ["Qutbuddin Aibak", "Iltutmish", "Balban", "Alauddin Khilji"],
          0,
        ],
        [
          "Qutbuddin Aibak belonged to which dynasty?",
          ["Slave", "Khilji", "Tughlaq", "Lodi"],
          0,
        ],
        [
          "Capital of Delhi Sultanate?",
          ["Agra", "Delhi", "Lahore", "Fatehpur Sikri"],
          1,
        ],
        [
          "Iltutmish introduced?",
          ["Iqta system", "Market control", "Currency reform", "Mansabdari"],
          0,
        ],
        [
          "First woman ruler of Delhi?",
          ["Noor Jahan", "Razia Sultana", "Begum Hazrat Mahal", "Chand Bibi"],
          1,
        ],
        [
          "Balban followed policy of?",
          ["Blood and iron", "Non-violence", "Tolerance", "Expansion"],
          0,
        ],
        [
          "Chalisa was group of?",
          ["Nobles", "Soldiers", "Priests", "Traders"],
          0,
        ],
        [
          "Qutb Minar was completed by?",
          ["Aibak", "Iltutmish", "Balban", "Alauddin"],
          1,
        ],
        [
          "Delhi Sultanate rulers were mostly?",
          ["Rajputs", "Afghans", "Turks", "Mughals"],
          2,
        ],
        [
          "Iqta system related to?",
          ["Land revenue", "Army", "Trade", "Judiciary"],
          0,
        ],
        [
          "Slave dynasty ended with?",
          ["Balban", "Kaiqubad", "Iltutmish", "Aibak"],
          1,
        ],
        [
          "Balban emphasized on?",
          ["Justice", "Royal authority", "Trade", "Art"],
          1,
        ],
        ["Sultan was assisted by?", ["Wazir", "Amir", "Ulema", "All"], 3],
        ["Court language was?", ["Hindi", "Persian", "Arabic", "Urdu"], 1],
        ["Delhi Sultanate began in?", ["1192", "1206", "1210", "1236"], 1],
      ],
    },
    {
      quizNumber: 10,
      title: "Delhi Sultanate – Khilji & Tughlaq",
      questions: [
        [
          "Founder of Khilji dynasty?",
          ["Jalaluddin Khilji", "Alauddin Khilji", "Balban", "Firoz Shah"],
          0,
        ],
        [
          "Alauddin Khilji introduced?",
          ["Market control", "Iqta system", "Mansabdari", "Zabt"],
          0,
        ],
        [
          "Alauddin Khilji defeated?",
          ["Mongols", "Rajputs", "Yadavas", "All"],
          3,
        ],
        [
          "Price control aimed to?",
          [
            "Help traders",
            "Control army expenses",
            "Increase revenue",
            "Help peasants",
          ],
          1,
        ],
        [
          "Capital shifted by Tughlaqs to?",
          ["Agra", "Daulatabad", "Lahore", "Kannauj"],
          1,
        ],
        [
          "Muhammad bin Tughlaq introduced?",
          ["Token currency", "Market control", "Mansabdari", "Iqta"],
          0,
        ],
        [
          "Token currency failed due to?",
          ["Forgery", "War", "Shortage", "Tax"],
          0,
        ],
        [
          "Firoz Shah Tughlaq known for?",
          ["Conquests", "Reforms", "Cruelty", "Trade"],
          1,
        ],
        ["Firoz Shah built?", ["Canals", "Mosques", "Roads", "All"], 3],
        [
          "Tughlaq architecture was?",
          ["Decorative", "Massive & plain", "Marble based", "Rock-cut"],
          1,
        ],
        [
          "Alauddin Khilji used which spy system?",
          ["Barid", "Munhiyan", "Sahna", "Waqia"],
          1,
        ],
        ["Revenue was collected in?", ["Cash", "Kind", "Both", "None"], 2],
        [
          "Tughlaq dynasty ended due to?",
          ["Revolts", "Invasions", "Weak rulers", "All"],
          3,
        ],
        [
          "Delhi Sultanate weakened after?",
          ["Alauddin", "Balban", "Firoz Shah", "Muhammad bin Tughlaq"],
          3,
        ],
        [
          "Main support of Sultanate army?",
          ["Cavalry", "Elephants", "Infantry", "Navy"],
          0,
        ],
      ],
    },
    {
      quizNumber: 11,
      title: "Vijayanagara Empire",
      questions: [
        [
          "Founder of Vijayanagara Empire?",
          ["Harihara I", "Bukka I", "Krishnadevaraya", "Devaraya II"],
          0,
        ],
        [
          "Vijayanagara empire was founded in?",
          ["1336", "1347", "1320", "1350"],
          0,
        ],
        [
          "Capital of Vijayanagara empire?",
          ["Hampi", "Madurai", "Warangal", "Bidar"],
          0,
        ],
        [
          "Vijayanagara was located on river?",
          ["Krishna", "Tungabhadra", "Cauvery", "Godavari"],
          1,
        ],
        [
          "Most famous ruler of Vijayanagara?",
          ["Harihara I", "Bukka I", "Krishnadevaraya", "Achyuta Raya"],
          2,
        ],
        [
          "Krishnadevaraya belonged to which dynasty?",
          ["Sangama", "Saluva", "Tuluva", "Aravidu"],
          2,
        ],
        [
          "Book Amuktamalyada written by?",
          ["Tenali Rama", "Krishnadevaraya", "Allasani Peddana", "Vidyapati"],
          1,
        ],
        [
          "Ashtadiggajas were?",
          ["Generals", "Ministers", "Poets", "Priests"],
          2,
        ],
        [
          "Main language of administration?",
          ["Kannada", "Telugu", "Sanskrit", "All"],
          3,
        ],
        [
          "Vijayanagara economy was based on?",
          ["Agriculture", "Trade", "Crafts", "All"],
          3,
        ],
        [
          "Foreign traveler Domingo Paes visited during?",
          ["Harihara I", "Bukka I", "Krishnadevaraya", "Rama Raya"],
          2,
        ],
        ["Battle of Talikota fought in?", ["1556", "1565", "1570", "1580"], 1],
        [
          "Battle of Talikota was against?",
          ["Mughals", "Bahmani rulers", "Deccan sultanates", "Portuguese"],
          2,
        ],
        [
          "After Talikota, capital shifted to?",
          ["Hampi", "Penukonda", "Madurai", "Warangal"],
          1,
        ],
        [
          "Vijayanagara rulers were followers of?",
          ["Islam", "Buddhism", "Hinduism", "Jainism"],
          2,
        ],
      ],
    },
    {
      quizNumber: 12,
      title: "Bahmani & Deccan Sultanates",
      questions: [
        [
          "Founder of Bahmani Sultanate?",
          [
            "Alauddin Hasan Bahman Shah",
            "Muhammad bin Tughlaq",
            "Firoz Shah",
            "Ahmad Shah",
          ],
          0,
        ],
        ["Bahmani Sultanate founded in?", ["1320", "1347", "1355", "1360"], 1],
        [
          "Capital of Bahmani Sultanate initially?",
          ["Bidar", "Gulbarga", "Bijapur", "Ahmednagar"],
          1,
        ],
        [
          "Later capital of Bahmani Sultanate?",
          ["Gulbarga", "Bidar", "Golconda", "Daulatabad"],
          1,
        ],
        [
          "Mahmud Gawan was a?",
          ["King", "General", "Prime Minister", "Poet"],
          2,
        ],
        [
          "Mahmud Gawan introduced reforms in?",
          ["Army", "Revenue", "Education", "All"],
          3,
        ],
        [
          "Bahmani kingdom later split into how many states?",
          ["3", "4", "5", "6"],
          2,
        ],
        [
          "Bijapur dynasty was called?",
          ["Adil Shahi", "Nizam Shahi", "Qutb Shahi", "Barid Shahi"],
          0,
        ],
        [
          "Golconda dynasty was?",
          ["Adil Shahi", "Nizam Shahi", "Qutb Shahi", "Imad Shahi"],
          2,
        ],
        [
          "Ahmednagar dynasty was?",
          ["Adil Shahi", "Nizam Shahi", "Qutb Shahi", "Barid Shahi"],
          1,
        ],
        [
          "Deccan sultanates were influenced by?",
          ["Persian culture", "Arab culture", "Turkish culture", "All"],
          3,
        ],
        [
          "Gol Gumbaz is located at?",
          ["Bidar", "Bijapur", "Golconda", "Ahmednagar"],
          1,
        ],
        [
          "Gol Gumbaz built by?",
          [
            "Muhammad Adil Shah",
            "Ibrahim Adil Shah",
            "Ali Adil Shah",
            "Yusuf Adil Shah",
          ],
          0,
        ],
        [
          "Whispering gallery is famous at?",
          ["Gol Gumbaz", "Qutub Minar", "Taj Mahal", "Charminar"],
          0,
        ],
        [
          "Decline of Deccan Sultanates due to?",
          ["Internal conflicts", "Mughal invasion", "Economic issues", "All"],
          3,
        ],
      ],
    },
    {
      quizNumber: 13,
      title: "Bhakti Movement",
      questions: [
        [
          "Bhakti movement emphasized?",
          ["Rituals", "Devotion", "Sacrifice", "War"],
          1,
        ],
        [
          "Bhakti movement started in?",
          ["North India", "South India", "East India", "West India"],
          1,
        ],
        ["Alvars were devotees of?", ["Shiva", "Vishnu", "Brahma", "Durga"], 1],
        [
          "Nayanars were devotees of?",
          ["Vishnu", "Shiva", "Buddha", "Jainism"],
          1,
        ],
        [
          "Ramanuja was associated with?",
          ["Shaivism", "Vaishnavism", "Sufism", "Buddhism"],
          1,
        ],
        [
          "Kabir preached?",
          ["Ritualism", "Caste system", "Unity of God", "Pilgrimage"],
          2,
        ],
        [
          "Kabir's verses compiled in?",
          ["Vedas", "Quran", "Guru Granth Sahib", "Ramcharitmanas"],
          2,
        ],
        ["Mirabai was devotee of?", ["Rama", "Krishna", "Shiva", "Vishnu"], 1],
        [
          "Tulsidas wrote?",
          ["Mahabharata", "Ramcharitmanas", "Gita", "Bhagavat Purana"],
          1,
        ],
        [
          "Bhakti saints opposed?",
          ["Devotion", "Caste system", "God", "Music"],
          1,
        ],
        [
          "Chaitanya Mahaprabhu worshipped?",
          ["Rama", "Krishna", "Shiva", "Vishnu"],
          1,
        ],
        [
          "Bhakti movement used language?",
          ["Sanskrit", "Persian", "Local languages", "Latin"],
          2,
        ],
        [
          "Namdev belonged to?",
          ["Maharashtra", "Tamil Nadu", "Punjab", "Gujarat"],
          0,
        ],
        [
          "Bhakti movement promoted?",
          ["Equality", "War", "Royal power", "Tax"],
          0,
        ],
        [
          "Impact of Bhakti movement?",
          ["Social unity", "Religious harmony", "Literature growth", "All"],
          3,
        ],
      ],
    },
    {
      quizNumber: 14,
      title: "Sufi Movement",
      questions: [
        [
          "Sufism belongs to which religion?",
          ["Hinduism", "Buddhism", "Islam", "Christianity"],
          2,
        ],
        [
          "Sufi saints emphasized?",
          ["Rituals", "Love of God", "War", "Politics"],
          1,
        ],
        ["Khanqah was?", ["Mosque", "School", "Sufi centre", "Palace"], 2],
        [
          "Chishti order founded by?",
          [
            "Muinuddin Chishti",
            "Nizamuddin Auliya",
            "Baba Farid",
            "Salim Chishti",
          ],
          0,
        ],
        [
          "Chishti order emphasized?",
          ["Royal patronage", "Isolation", "Service to people", "War"],
          2,
        ],
        [
          "Nizamuddin Auliya lived in?",
          ["Ajmer", "Delhi", "Agra", "Lahore"],
          1,
        ],
        [
          "Ajmer Sharif dargah belongs to?",
          [
            "Salim Chishti",
            "Nizamuddin Auliya",
            "Muinuddin Chishti",
            "Baba Farid",
          ],
          2,
        ],
        [
          "Sufi poetry language?",
          ["Arabic", "Persian", "Local languages", "All"],
          3,
        ],
        [
          "Sufis believed in?",
          ["Strict law", "Love & devotion", "Politics", "Wealth"],
          1,
        ],
        ["Dargah is?", ["Tomb", "School", "Library", "Court"], 0],
        ["Sufi music form?", ["Bhajan", "Qawwali", "Kirtan", "Ghazal"], 1],
        [
          "Sufis opposed?",
          ["Idol worship", "Formal rituals", "Love", "Service"],
          1,
        ],
        [
          "Sufi saints attracted?",
          ["Only Muslims", "Only Hindus", "People of all faiths", "Kings only"],
          2,
        ],
        ["Sufi movement promoted?", ["Harmony", "Division", "War", "Caste"], 0],
        [
          "Impact of Sufism on India?",
          ["Cultural synthesis", "Conflict", "Isolation", "Decline"],
          0,
        ],
      ],
    },
    {
      quizNumber: 15,
      title: "Mughal Empire – Foundation",
      questions: [
        [
          "Founder of Mughal Empire?",
          ["Babur", "Humayun", "Akbar", "Sher Shah"],
          0,
        ],
        [
          "Babur defeated Ibrahim Lodi at?",
          ["Panipat", "Khanwa", "Chausa", "Kannauj"],
          0,
        ],
        [
          "First Battle of Panipat fought in?",
          ["1526", "1527", "1530", "1540"],
          0,
        ],
        [
          "Babur belonged to?",
          [
            "Afghan lineage",
            "Turkish-Mongol lineage",
            "Arab lineage",
            "Persian lineage",
          ],
          1,
        ],
        [
          "Babur wrote autobiography called?",
          ["Akbarnama", "Baburnama", "Humayunnama", "Tuzuk-i-Baburi"],
          1,
        ],
        [
          "Humayun was defeated by?",
          ["Akbar", "Sher Shah Suri", "Rana Sanga", "Hemu"],
          1,
        ],
        [
          "Sher Shah Suri founded which dynasty?",
          ["Mughal", "Sur", "Lodi", "Slave"],
          1,
        ],
        ["Sher Shah's capital was?", ["Agra", "Delhi", "Sasaram", "Lahore"], 2],
        [
          "Sher Shah introduced?",
          ["Mansabdari", "Land revenue system", "Market control", "Iqta"],
          1,
        ],
        [
          "Rupiya currency introduced by?",
          ["Babur", "Akbar", "Sher Shah", "Humayun"],
          2,
        ],
        [
          "Sher Shah built?",
          ["Qutub Minar", "Grand Trunk Road", "Red Fort", "Agra Fort"],
          1,
        ],
        ["Humayun regained throne in?", ["1545", "1550", "1555", "1560"], 2],
        [
          "Humayun died due to?",
          ["Battle injury", "Poison", "Fall from stairs", "Illness"],
          2,
        ],
        [
          "Second Battle of Panipat fought in?",
          ["1556", "1565", "1576", "1605"],
          0,
        ],
        ["Akbar became king at age?", ["10", "13", "15", "18"], 1],
      ],
    },
    {
      quizNumber: 16,
      title: "Mughal Empire – Akbar & Administration",
      questions: [
        [
          "Akbar's regent during early reign?",
          ["Bairam Khan", "Abul Fazl", "Todar Mal", "Birbal"],
          0,
        ],
        [
          "Akbar introduced which revenue system?",
          ["Zabt", "Iqta", "Ryotwari", "Permanent settlement"],
          0,
        ],
        [
          "Zabt system was implemented by?",
          ["Akbar", "Todar Mal", "Bairam Khan", "Abul Fazl"],
          1,
        ],
        [
          "Mansabdari system related to?",
          ["Army & administration", "Revenue", "Judiciary", "Trade"],
          0,
        ],
        [
          "Akbar followed policy of?",
          [
            "Religious intolerance",
            "Religious tolerance",
            "Isolation",
            "Expansion only",
          ],
          1,
        ],
        ["Din-i-Ilahi was started in?", ["1575", "1580", "1582", "1590"], 2],
        [
          "Ibadat Khana was at?",
          ["Agra", "Delhi", "Fatehpur Sikri", "Lahore"],
          2,
        ],
        [
          "Akbarnama written by?",
          ["Abul Fazl", "Badauni", "Faizi", "Birbal"],
          0,
        ],
        [
          "Ain-i-Akbari deals with?",
          ["Wars", "Administration", "Religion", "Trade"],
          1,
        ],
        [
          "Akbar's capital Fatehpur Sikri is in?",
          ["Delhi", "Agra", "Jaipur", "Mathura"],
          1,
        ],
        [
          "Buland Darwaza built to commemorate?",
          [
            "Akbar's birth",
            "Gujarat victory",
            "Rajput alliance",
            "Din-i-Ilahi",
          ],
          1,
        ],
        [
          "Akbar married Rajput princess from?",
          ["Amber", "Marwar", "Mewar", "Bikaner"],
          0,
        ],
        [
          "Rajput policy strengthened Mughal rule because?",
          ["Military support", "Political stability", "Loyalty", "All"],
          3,
        ],
        ["Akbar died in?", ["1600", "1603", "1605", "1610"], 2],
        [
          "Akbar was succeeded by?",
          ["Shah Jahan", "Jahangir", "Aurangzeb", "Dara Shikoh"],
          1,
        ],
      ],
    },
    {
      quizNumber: 17,
      title: "Mughal Empire – Jahangir to Aurangzeb",
      questions: [
        ["Jahangir's real name?", ["Salim", "Akbar II", "Khurram", "Dara"], 0],
        [
          "Jahangir's justice chain was called?",
          ["Zanjir-i-Adl", "Adalat chain", "Insaf chain", "Nyaya chain"],
          0,
        ],
        [
          "Nur Jahan was wife of?",
          ["Akbar", "Jahangir", "Shah Jahan", "Aurangzeb"],
          1,
        ],
        [
          "Shah Jahan built?",
          ["Red Fort", "Taj Mahal", "Jama Masjid", "All"],
          3,
        ],
        [
          "Taj Mahal built in memory of?",
          ["Nur Jahan", "Mumtaz Mahal", "Jahanara", "Roshanara"],
          1,
        ],
        [
          "Shah Jahan period known as?",
          [
            "Golden age of Mughals",
            "Decline period",
            "War period",
            "Reform period",
          ],
          0,
        ],
        [
          "Aurangzeb followed policy of?",
          ["Tolerance", "Religious orthodoxy", "Peace", "Isolation"],
          1,
        ],
        [
          "Aurangzeb reimposed?",
          ["Jizya tax", "Zabt system", "Din-i-Ilahi", "Mansabdari"],
          0,
        ],
        [
          "Longest reigning Mughal emperor?",
          ["Akbar", "Jahangir", "Shah Jahan", "Aurangzeb"],
          3,
        ],
        [
          "Aurangzeb fought maximum wars in?",
          ["North India", "Deccan", "Bengal", "Rajputana"],
          1,
        ],
        [
          "Deccan wars weakened Mughals because?",
          ["Long duration", "High cost", "Resistance", "All"],
          3,
        ],
        [
          "Sikh Guru executed by Aurangzeb?",
          [
            "Guru Nanak",
            "Guru Arjan",
            "Guru Tegh Bahadur",
            "Guru Gobind Singh",
          ],
          2,
        ],
        ["Aurangzeb died in?", ["1700", "1707", "1712", "1720"], 1],
        [
          "After Aurangzeb Mughal empire?",
          ["Expanded", "Collapsed rapidly", "Strengthened", "Modernized"],
          1,
        ],
        [
          "Last powerful Mughal ruler?",
          ["Aurangzeb", "Bahadur Shah Zafar", "Shah Alam II", "Farrukhsiyar"],
          0,
        ],
      ],
    },
    {
      quizNumber: 18,
      title: "Marathas",
      questions: [
        [
          "Founder of Maratha power?",
          ["Shivaji", "Sambhaji", "Baji Rao I", "Balaji Vishwanath"],
          0,
        ],
        ["Shivaji crowned in?", ["1670", "1672", "1674", "1680"], 2],
        ["Capital of Shivaji?", ["Raigad", "Pune", "Satara", "Kolhapur"], 0],
        [
          "Maratha administration based on?",
          ["Ashta Pradhan", "Mansabdari", "Iqta", "Zabt"],
          0,
        ],
        ["Peshwa was?", ["King", "Prime minister", "General", "Governor"], 1],
        ["Chauth was?", ["Tax", "Army", "Post", "Law"], 0],
        [
          "Sardeshmukhi was?",
          ["Extra tax", "Land revenue", "Army fund", "Religious tax"],
          0,
        ],
        [
          "Shivaji followed which religion?",
          ["Islam", "Christianity", "Hinduism", "Jainism"],
          2,
        ],
        [
          "Treaty of Purandar signed with?",
          ["Mughals", "British", "Portuguese", "Dutch"],
          0,
        ],
        [
          "Shivaji escaped from Agra by?",
          ["Bribery", "Army", "Disguise", "Diplomacy"],
          2,
        ],
        [
          "Most powerful Peshwa?",
          ["Balaji Vishwanath", "Baji Rao I", "Balaji Baji Rao", "Madhav Rao"],
          1,
        ],
        [
          "Third Battle of Panipat fought in?",
          ["1757", "1761", "1764", "1770"],
          1,
        ],
        [
          "Marathas were defeated by?",
          ["British", "Afghans", "Mughals", "Portuguese"],
          1,
        ],
        [
          "Maratha power declined due to?",
          ["Internal conflicts", "Panipat defeat", "British rise", "All"],
          3,
        ],
        [
          "Shivaji's navy protected?",
          ["Arabian Sea coast", "Bay of Bengal", "Indian Ocean", "Red Sea"],
          0,
        ],
      ],
    },
    {
      quizNumber: 19,
      title: "Advent of Europeans & British Rule",
      questions: [
        [
          "First Europeans to come to India?",
          ["British", "Dutch", "Portuguese", "French"],
          2,
        ],
        [
          "Vasco da Gama reached India in?",
          ["1492", "1498", "1500", "1510"],
          1,
        ],
        [
          "British East India Company formed in?",
          ["1599", "1600", "1605", "1610"],
          1,
        ],
        [
          "French East India Company formed in?",
          ["1640", "1664", "1670", "1680"],
          1,
        ],
        ["Battle of Plassey fought in?", ["1757", "1761", "1764", "1772"], 0],
        [
          "Battle of Plassey was between?",
          [
            "British & French",
            "British & Nawab of Bengal",
            "British & Marathas",
            "British & Sikhs",
          ],
          1,
        ],
        [
          "Mir Jafar was?",
          [
            "British governor",
            "Nawab of Bengal",
            "French general",
            "Maratha leader",
          ],
          1,
        ],
        ["Battle of Buxar fought in?", ["1757", "1764", "1772", "1780"], 1],
        [
          "Battle of Buxar gave British?",
          [
            "Political power",
            "Diwani rights",
            "Trade monopoly",
            "Military base",
          ],
          1,
        ],
        [
          "Diwani rights related to?",
          ["Justice", "Trade", "Revenue", "Army"],
          2,
        ],
        [
          "First Governor-General of India?",
          ["Warren Hastings", "Clive", "Dalhousie", "Wellesley"],
          0,
        ],
        [
          "Subsidiary Alliance introduced by?",
          ["Hastings", "Wellesley", "Dalhousie", "Curzon"],
          1,
        ],
        [
          "Doctrine of Lapse introduced by?",
          ["Dalhousie", "Bentinck", "Curzon", "Hastings"],
          0,
        ],
        [
          "British capital shifted to Delhi in?",
          ["1905", "1911", "1920", "1935"],
          1,
        ],
        ["Company rule ended in?", ["1857", "1858", "1860", "1870"], 1],
      ],
    },
    {
      quizNumber: 20,
      title: "Revolt of 1857 & British Administration",
      questions: [
        [
          "Revolt of 1857 started at?",
          ["Delhi", "Kanpur", "Meerut", "Lucknow"],
          2,
        ],
        [
          "Immediate cause of revolt?",
          ["Land revenue", "Greased cartridges", "Doctrine of lapse", "Tax"],
          1,
        ],
        [
          "Leader of revolt in Kanpur?",
          ["Rani Lakshmibai", "Nana Saheb", "Kunwar Singh", "Bahadur Shah"],
          1,
        ],
        [
          "Leader of revolt in Jhansi?",
          [
            "Begum Hazrat Mahal",
            "Rani Lakshmibai",
            "Tantia Tope",
            "Nana Saheb",
          ],
          1,
        ],
        [
          "Last Mughal emperor during revolt?",
          ["Bahadur Shah Zafar", "Akbar II", "Aurangzeb II", "Shah Alam"],
          0,
        ],
        [
          "Revolt failed due to?",
          ["Poor planning", "Lack of unity", "British strength", "All"],
          3,
        ],
        [
          "Revolt of 1857 is also called?",
          [
            "First war of independence",
            "Sepoy mutiny",
            "Civil war",
            "Peasant revolt",
          ],
          0,
        ],
        ["British Crown rule started in?", ["1857", "1858", "1861", "1870"], 1],
        [
          "Queen Victoria's Proclamation issued in?",
          ["1857", "1858", "1860", "1865"],
          1,
        ],
        [
          "Governor-General became?",
          ["King", "Viceroy", "Prime minister", "Secretary"],
          1,
        ],
        [
          "Indian Civil Service introduced in?",
          ["1858", "1861", "1870", "1885"],
          1,
        ],
        [
          "Army reorganization aimed to?",
          ["Reduce Indians", "Increase Europeans", "Divide regiments", "All"],
          3,
        ],
        [
          "Policy after 1857 was?",
          [
            "Expansion",
            "Non-interference",
            "Aggressive annexation",
            "Isolation",
          ],
          1,
        ],
        [
          "Indian Councils Act first passed in?",
          ["1861", "1892", "1909", "1919"],
          0,
        ],
        [
          "Major impact of 1857 revolt?",
          [
            "End of company rule",
            "Beginning of nationalism",
            "British reforms",
            "All",
          ],
          3,
        ],
      ],
    },
  ];

  // 1. UPSERT CATEGORY
  const category = await prisma.category.upsert({
    where: { name: "Science" },
    update: {},
    create: { name: "Science" },
  });

  console.log(`📂 Category "${category.name}" ready.`);

  // 2. SEED LOOP
  for (const quiz of scienceData) {
    // Check if title already exists to avoid duplication
    const existingQuiz = await prisma.quiz.findFirst({
      where: { title: quiz?.quizTitle, categoryId: category.id },
    });

    if (!existingQuiz) {
      await prisma.quiz.create({
        data: {
          title: quiz?.quizTitle,
          quizNumber: quiz?.quizNumber,
          timeLimit: 5,
          totalPoints: 60,
          categoryId: category.id,
          questions: {
            // Apply shuffling logic to every question
            create: quiz?.questions.map((q) =>
              shuffleAndFormat(q[0] as string, q[1] as string[], q[2] as number)
            ),
          },
        },
      });
      console.log(`✅ Seeded Quiz ${quiz.quizNumber}: ${quiz?.quizTitle}`);
    } else {
      console.log(`⏩ Skipped Quiz ${quiz.quizNumber} (Already exists)`);
    }
  }

  console.log("🏁 Science Category Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
