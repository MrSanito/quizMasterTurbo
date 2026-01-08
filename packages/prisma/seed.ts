import { prisma } from "./lib/prisma";

async function main() {
  console.log("🚀 Seeding Entertainment Category (Bollywood & Hollywood)...");

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

  const entertainmentData = [
    {
      quizNumber: 1,
      title: "Bollywood Legends & Blockbusters",
      questions: [
        [
          "Who is known as the 'Shahenshah' of Bollywood?",
          ["Shah Rukh Khan", "Amitabh Bachchan", "Dilip Kumar", "Salman Khan"],
          1,
        ],
        [
          "Which movie is the first Indian talkie?",
          ["Raja Harishchandra", "Alam Ara", "Kisan Kanya", "Mughal-e-Azam"],
          1,
        ],
        [
          "Gabbar Singh is the villain in which iconic film?",
          ["Don", "Sholay", "Zanjeer", "Deewaar"],
          1,
        ],
        [
          "Who directed the Hollywood hit 'Inception'?",
          [
            "Christopher Nolan",
            "Steven Spielberg",
            "James Cameron",
            "Ridley Scott",
          ],
          0,
        ],
        [
          "Which actor played 'Jack' in Titanic?",
          ["Brad Pitt", "Leonardo DiCaprio", "Johnny Depp", "Tom Cruise"],
          1,
        ],
        [
          "Which actress made her debut in 'Om Shanti Om'?",
          ["Deepika Padukone", "Anushka Sharma", "Katrina Kaif", "Alia Bhatt"],
          0,
        ],
        [
          "Who is the 'King of Pop'?",
          ["Michael Jackson", "Elvis Presley", "Prince", "Madonna"],
          0,
        ],
        [
          "Which film features the character 'Mogambo'?",
          ["Mr. India", "Shaan", "Karma", "Tehelka"],
          0,
        ],
        [
          "Highest grossing film of all time (unadjusted)?",
          ["Endgame", "Avatar", "Titanic", "Star Wars"],
          1,
        ],
        [
          "Which movie is based on the life of Mahavir Phogat?",
          ["Sultan", "Dangal", "Mary Kom", "Gold"],
          1,
        ],
        [
          "Who played 'Iron Man' in the MCU?",
          ["Chris Evans", "Robert Downey Jr.", "Mark Ruffalo", "Chris Pratt"],
          1,
        ],
        [
          "Aamir Khan played a teacher in which film?",
          ["3 Idiots", "Taare Zameen Par", "PK", "Ghajini"],
          1,
        ],
        [
          "First Indian film to be nominated for an Oscar?",
          ["Lagaan", "Mother India", "Salaam Bombay", "Devdas"],
          1,
        ],
        [
          "Who directed 'Jurassic Park'?",
          ["Steven Spielberg", "George Lucas", "James Cameron", "J.J. Abrams"],
          0,
        ],
        [
          "Which actor is known as 'Mr. Perfectionist'?",
          ["Shah Rukh Khan", "Salman Khan", "Aamir Khan", "Akshay Kumar"],
          2,
        ],
      ],
    },
    {
      quizNumber: 2,
      title: "Superstars & Iconic Roles",
      questions: [
        [
          "Salman Khan's debut film as a lead was?",
          ["Maine Pyar Kiya", "Biwi Ho To Aisi", "Saajan", "Baaghi"],
          0,
        ],
        [
          "Who played the Joker in 'The Dark Knight'?",
          ["Jack Nicholson", "Heath Ledger", "Joaquin Phoenix", "Jared Leto"],
          1,
        ],
        [
          "Which movie features the song 'Chaiyya Chaiyya'?",
          ["Dil Se", "Kuch Kuch Hota Hai", "Baazigar", "Josh"],
          0,
        ],
        [
          "Who is the director of 'Avatar'?",
          [
            "James Cameron",
            "Christopher Nolan",
            "Peter Jackson",
            "Ridley Scott",
          ],
          0,
        ],
        [
          "Ranbir Kapoor's debut film was?",
          ["Saawariya", "Wake Up Sid", "Rockstar", "Barfi"],
          0,
        ],
        [
          "Who played 'Harry Potter' in the films?",
          [
            "Rupert Grint",
            "Daniel Radcliffe",
            "Tom Felton",
            "Robert Pattinson",
          ],
          1,
        ],
        [
          "Which Bollywood film stars SRK as a NASA scientist?",
          ["Ra.One", "Swades", "Zero", "Don 2"],
          1,
        ],
        [
          "Director of 'The Godfather'?",
          ["Scorsese", "Francis Ford Coppola", "Tarantino", "Spielberg"],
          1,
        ],
        [
          "Priyanka Chopra won Miss World in?",
          ["1994", "2000", "1998", "2002"],
          1,
        ],
        [
          "Which actor played Captain America?",
          ["Chris Hemsworth", "Chris Evans", "Chris Pratt", "Chris Rock"],
          1,
        ],
        [
          "First Indian movie to win a National Award?",
          ["Mirza Ghalib", "Shyamchi Aai", "Pather Panchali", "Devdas"],
          1,
        ],
        [
          "Actor who played 'Munna Bhai'?",
          ["Sanjay Dutt", "Arshad Warsi", "Suniel Shetty", "Jackie Shroff"],
          0,
        ],
        [
          "Who directed 'Interstellar'?",
          [
            "Christopher Nolan",
            "Alfonso Cuarón",
            "Zack Snyder",
            "Ridley Scott",
          ],
          0,
        ],
        [
          "Song 'Jai Ho' is from which movie?",
          ["Lagaan", "Slumdog Millionaire", "Dil Se", "Rockstar"],
          1,
        ],
        [
          "Which actress is called 'The Dream Girl'?",
          ["Rekha", "Hema Malini", "Sridevi", "Madhuri Dixit"],
          1,
        ],
      ],
    },
    {
      quizNumber: 3,
      title: "Action & Drama Mix",
      questions: [
        [
          "Who played 'Baahubali'?",
          ["Prabhas", "Rana Daggubati", "Ram Charan", "Allu Arjun"],
          0,
        ],
        [
          "Which movie features 'The Avengers'?",
          ["DC", "Marvel", "Sony", "Universal"],
          1,
        ],
        [
          "Shah Rukh Khan's character in DDLJ?",
          ["Rahul", "Raj", "Prem", "Arjun"],
          1,
        ],
        [
          "Which Hollywood film stars a talking Raccoon?",
          ["Guardians of the Galaxy", "Star Wars", "Star Trek", "Men in Black"],
          0,
        ],
        [
          "Director of 'Gangs of Wasseypur'?",
          ["Anurag Kashyap", "Vishal Bhardwaj", "Karan Johar", "Rohit Shetty"],
          0,
        ],
        [
          "Who played 'Wonder Woman'?",
          ["Scarlett Johansson", "Gal Gadot", "Brie Larson", "Margot Robbie"],
          1,
        ],
        [
          "Amitabh Bachchan's first film?",
          ["Zanjeer", "Saat Hindustani", "Anand", "Don"],
          1,
        ],
        [
          "Which movie features the line 'Why so serious?'",
          ["The Dark Knight", "Joker", "Batman Begins", "Inception"],
          0,
        ],
        [
          "Ayushmann Khurrana's debut film?",
          ["Vicky Donor", "Dum Laga Ke Haisha", "Andhadhun", "Article 15"],
          0,
        ],
        [
          "Actor who played 'Thanos'?",
          ["Josh Brolin", "Tom Hiddleston", "Mark Ruffalo", "Vin Diesel"],
          0,
        ],
        [
          "Which film won Best Picture at 2020 Oscars?",
          ["1917", "Parasite", "Joker", "The Irishman"],
          1,
        ],
        [
          "Akshay Kumar's martial arts based film?",
          [
            "Chandni Chowk to China",
            "International Khiladi",
            "Khiladi",
            "Aitraaz",
          ],
          0,
        ],
        [
          "Female lead in 'Titanic'?",
          ["Kate Winslet", "Emma Watson", "Julia Roberts", "Anne Hathaway"],
          0,
        ],
        [
          "Which movie features 'Circuit' as a sidekick?",
          ["Munna Bhai MBBS", "Golmaal", "Dhamaal", "Hera Pheri"],
          0,
        ],
        [
          "Who played 'Neo' in The Matrix?",
          ["Keanu Reeves", "Will Smith", "Brad Pitt", "Tom Cruise"],
          0,
        ],
      ],
    },
    {
      quizNumber: 4,
      title: "Music & Awards",
      questions: [
        [
          "Who won the first Oscar for India?",
          ["Satyajit Ray", "Bhanu Athaiya", "A.R. Rahman", "Gulzar"],
          1,
        ],
        [
          "Director of 'La La Land'?",
          ["Damien Chazelle", "Greta Gerwig", "Wes Anderson", "Nolan"],
          0,
        ],
        [
          "A.R. Rahman won 2 Oscars for which film?",
          ["Lagaan", "Slumdog Millionaire", "127 Hours", "Roja"],
          1,
        ],
        [
          "Who played 'Freddie Mercury' in Bohemian Rhapsody?",
          ["Rami Malek", "Sacha Baron Cohen", "Adam Lambert", "Tom Hardy"],
          0,
        ],
        [
          "Kishore Kumar's real name?",
          ["Abhas Kumar Ganguly", "Ashok Kumar", "Sunil Dutt", "Dev Anand"],
          0,
        ],
        [
          "Who is the 'Baadshah' of Bollywood?",
          ["Shah Rukh Khan", "Salman Khan", "Aamir Khan", "Akshay Kumar"],
          0,
        ],
        [
          "Which movie features 'Simba'?",
          ["The Lion King", "Madagascar", "Ice Age", "Bambi"],
          0,
        ],
        [
          "Singer of 'Tum Hi Ho'?",
          ["Arijit Singh", "Atif Aslam", "Honey Singh", "Badshah"],
          0,
        ],
        [
          "Who played 'Katniss Everdeen'?",
          ["Jennifer Lawrence", "Emma Stone", "Zendaya", "Kristen Stewart"],
          0,
        ],
        [
          "Which Bollywood film is about a deaf-mute girl?",
          ["Barfi", "Black", "Guzaarish", "Paa"],
          0,
        ],
        [
          "Director of 'Titanic'?",
          ["James Cameron", "Spielberg", "Cameron Crowe", "George Lucas"],
          0,
        ],
        [
          "Sridevi's last major film?",
          ["English Vinglish", "Mom", "Puli", "Mr. India"],
          1,
        ],
        [
          "Who played 'Deadpool'?",
          ["Ryan Reynolds", "Hugh Jackman", "Chris Pratt", "Jake Gyllenhaal"],
          0,
        ],
        [
          "Which film won the first Filmfare Best Film award?",
          ["Do Bigha Zamin", "Mother India", "Mughal-e-Azam", "Devdas"],
          0,
        ],
        [
          "First 100-crore film in India?",
          ["Ghajini", "3 Idiots", "Dabangg", "Bodyguard"],
          0,
        ],
      ],
    },
    {
      quizNumber: 5,
      title: "Modern Hits & Global Stars",
      questions: [
        [
          "Who played 'Gully Boy'?",
          ["Ranveer Singh", "Ranbir Kapoor", "Varun Dhawan", "Tiger Shroff"],
          0,
        ],
        [
          "Which actor played 'Wolverine'?",
          ["Hugh Jackman", "Tom Hardy", "Henry Cavill", "Scott Eastwood"],
          0,
        ],
        [
          "Vicky Kaushal won National Award for?",
          ["Uri", "Masaan", "Raazi", "Sardar Udham"],
          0,
        ],
        [
          "Who directed 'Once Upon a Time in Hollywood'?",
          ["Tarantino", "Scorsese", "Nolan", "Fincher"],
          0,
        ],
        [
          "Deepika Padukone's Hollywood debut?",
          [
            "xXx: Return of Xander Cage",
            "Fast & Furious",
            "Baywatch",
            "The Eternals",
          ],
          0,
        ],
        [
          "Who played 'Thor'?",
          [
            "Chris Hemsworth",
            "Liam Hemsworth",
            "Chris Evans",
            "Tom Hiddleston",
          ],
          0,
        ],
        [
          "Rajat Kapoor's famous small budget film?",
          ["Ankhon Dekhi", "Kapoor & Sons", "Dil Chahta Hai", "Rock On"],
          0,
        ],
        [
          "Which movie features 'Black Panther'?",
          ["Marvel", "DC", "Pixar", "Warner Bros"],
          0,
        ],
        [
          "Alia Bhatt's debut as a student?",
          ["Student of the Year", "Highway", "Raazi", "Udta Punjab"],
          0,
        ],
        [
          "Who played 'Sherlock Holmes' (Movies)?",
          [
            "Robert Downey Jr.",
            "Benedict Cumberbatch",
            "Henry Cavill",
            "Jude Law",
          ],
          0,
        ],
        [
          "Director of 'Bahubali'?",
          ["S.S. Rajamouli", "Prashanth Neel", "Mani Ratnam", "Shankar"],
          0,
        ],
        [
          "Which actress played 'Mary Kom'?",
          [
            "Priyanka Chopra",
            "Deepika Padukone",
            "Anushka Sharma",
            "Kangana Ranaut",
          ],
          0,
        ],
        [
          "Who played 'Black Widow'?",
          [
            "Scarlett Johansson",
            "Elizabeth Olsen",
            "Florence Pugh",
            "Brie Larson",
          ],
          0,
        ],
        [
          "Which film features 'The Silk Smitha' story?",
          ["The Dirty Picture", "Fashion", "Heroine", "Page 3"],
          0,
        ],
        [
          "Who played 'Spider-Man' (MCU)?",
          ["Tom Holland", "Andrew Garfield", "Tobey Maguire", "Shia LaBeouf"],
          0,
        ],
      ],
    },
    {
      quizNumber: 6,
      title: "The Golden Era & Global Icons",
      questions: [
        [
          "Who was the 'Tragedy King' of Bollywood?",
          ["Dilip Kumar", "Raj Kapoor", "Dev Anand", "Guru Dutt"],
          0,
        ],
        [
          "Which movie is known as the 'Greatest Bollywood Epic'?",
          ["Mughal-e-Azam", "Mother India", "Pather Panchali", "Sholay"],
          0,
        ],
        [
          "Who played 'Bond' in Goldfinger?",
          ["Sean Connery", "Roger Moore", "Pierce Brosnan", "Daniel Craig"],
          0,
        ],
        [
          "Raj Kapoor was often called the Indian version of who?",
          ["Charlie Chaplin", "Buster Keaton", "Marlon Brando", "James Dean"],
          0,
        ],
        [
          "Which Bollywood star is known as 'Big B'?",
          ["Amitabh Bachchan", "Shah Rukh Khan", "Salman Khan", "Akshay Kumar"],
          0,
        ],
        [
          "Who directed the Psycho (1960)?",
          ["Alfred Hitchcock", "Stanley Kubrick", "Orson Welles", "John Ford"],
          0,
        ],
        [
          "Madhubala's most famous role was in which film?",
          [
            "Mughal-e-Azam",
            "Chalti Ka Naam Gaadi",
            "Mr. & Mrs. '55",
            "Howrah Bridge",
          ],
          0,
        ],
        [
          "Which actor played 'Rocky Balboa'?",
          [
            "Sylvester Stallone",
            "Arnold Schwarzenegger",
            "Bruce Willis",
            "Jean-Claude Van Damme",
          ],
          0,
        ],
        [
          "First Indian film to win the Palme d'Or at Cannes?",
          ["Neecha Nagar", "Do Bigha Zamin", "Pather Panchali", "Boot Polish"],
          0,
        ],
        [
          "Who played 'The Terminator'?",
          [
            "Arnold Schwarzenegger",
            "Sylvester Stallone",
            "Dolph Lundgren",
            "Bruce Willis",
          ],
          0,
        ],
        [
          "Which actress was known as 'The Venus of Indian Cinema'?",
          ["Madhubala", "Nargis", "Meena Kumari", "Vyjayanthimala"],
          0,
        ],
        [
          "Director of 'Pulp Fiction'?",
          [
            "Quentin Tarantino",
            "Martin Scorsese",
            "Guy Ritchie",
            "David Fincher",
          ],
          0,
        ],
        [
          "Manoj Kumar was famous for which genre?",
          ["Patriotic", "Romantic", "Thriller", "Comedy"],
          0,
        ],
        [
          "Who played 'Han Solo' in Star Wars?",
          ["Harrison Ford", "Mark Hamill", "Carrie Fisher", "Alec Guinness"],
          0,
        ],
        [
          "Waheeda Rehman made her debut in which film?",
          ["CID", "Pyaasa", "Kaagaz Ke Phool", "Guide"],
          0,
        ],
      ],
    },
    {
      quizNumber: 7,
      title: "Comedy Kings & Rom-Coms",
      questions: [
        [
          "Who played the character 'Babu Rao' in Hera Pheri?",
          ["Paresh Rawal", "Akshay Kumar", "Suniel Shetty", "Johnny Lever"],
          0,
        ],
        [
          "Which Hollywood actor starred in 'The Mask'?",
          ["Jim Carrey", "Adam Sandler", "Ben Stiller", "Will Ferrell"],
          0,
        ],
        [
          "Govinda's partner in many 'No. 1' films?",
          ["David Dhawan", "Karan Johar", "Yash Chopra", "Subhash Ghai"],
          0,
        ],
        [
          "Who directed 'The Hangover'?",
          ["Todd Phillips", "Seth Rogen", "Judd Apatow", "Jon Favreau"],
          0,
        ],
        [
          "Which movie features the dialogue 'All is Well'?",
          ["3 Idiots", "PK", "Dil Chahta Hai", "Munna Bhai MBBS"],
          0,
        ],
        [
          "Female lead in 'Pretty Woman'?",
          ["Julia Roberts", "Sandra Bullock", "Meg Ryan", "Nicole Kidman"],
          0,
        ],
        [
          "Mehmood was a legendary actor in which genre?",
          ["Comedy", "Action", "Horror", "Drama"],
          0,
        ],
        [
          "Who played 'Mrs. Doubtfire'?",
          ["Robin Williams", "Dustin Hoffman", "Tom Hanks", "Jack Nicholson"],
          0,
        ],
        [
          "Juhi Chawla's breakthrough film?",
          ["Qayamat Se Qayamat Tak", "Darr", "Ishq", "Hum Hain Rahi Pyar Ke"],
          0,
        ],
        [
          "Which film stars Adam Sandler as a golfer?",
          ["Happy Gilmore", "Billy Madison", "Big Daddy", "The Waterboy"],
          0,
        ],
        [
          "Ritesh Deshmukh's debut film?",
          ["Tujhe Meri Kasam", "Masti", "Kyaa Kool Hai Hum", "Housefull"],
          0,
        ],
        [
          "Who played 'The Grinch' (Live Action)?",
          ["Jim Carrey", "Mike Myers", "Will Ferrell", "Eddie Murphy"],
          0,
        ],
        [
          "Which film is about three friends going to Goa?",
          [
            "Dil Chahta Hai",
            "Zindagi Na Milegi Dobara",
            "Go Goa Gone",
            "Rock On",
          ],
          0,
        ],
        [
          "Who is the 'King of Comedy' in old Hollywood?",
          ["Charlie Chaplin", "Buster Keaton", "Harold Lloyd", "Groucho Marx"],
          0,
        ],
        [
          "Lead actor of 'Andaz Apna Apna' (Both)?",
          ["Aamir & Salman", "SRK & Aamir", "Salman & SRK", "Akshay & Suniel"],
          0,
        ],
      ],
    },
    {
      quizNumber: 8,
      title: "Sci-Fi & Visual Effects",
      questions: [
        [
          "First Indian film to use extensive CGI?",
          ["Ra.One", "Krrish", "Robot", "Magadheera"],
          1,
        ],
        [
          "Who directed '2001: A Space Odyssey'?",
          ["Stanley Kubrick", "George Lucas", "Spielberg", "Scott"],
          0,
        ],
        [
          "Hrithik Roshan's superhero character?",
          ["Krrish", "Ra.One", "G.One", "Shaktimaan"],
          0,
        ],
        [
          "Which movie features the world of 'Pandora'?",
          ["Avatar", "Star Wars", "Prometheus", "Dune"],
          0,
        ],
        [
          "Shah Rukh Khan's superhero film?",
          ["Ra.One", "Krrish", "Drona", "Robot"],
          0,
        ],
        [
          "Who directed 'Blade Runner'?",
          [
            "Ridley Scott",
            "James Cameron",
            "George Lucas",
            "Christopher Nolan",
          ],
          0,
        ],
        [
          "Rajinikanth's role in 'Enthiran'?",
          ["Chitti", "Baashha", "Kabali", "Petta"],
          0,
        ],
        [
          "Which movie features a 'T-Rex'?",
          ["Jurassic Park", "King Kong", "Godzilla", "Transformers"],
          0,
        ],
        [
          "India's first space film?",
          ["Tik Tik Tik", "Mission Mangal", "Antariksham", "Cargo"],
          0,
        ],
        [
          "Who played 'Agent J' in Men in Black?",
          [
            "Will Smith",
            "Tommy Lee Jones",
            "Samuel L. Jackson",
            "Eddie Murphy",
          ],
          0,
        ],
        [
          "Director of 'The Matrix'?",
          ["The Wachowskis", "The Russos", "The Coens", "The Nolans"],
          0,
        ],
        [
          "Which Bollywood film is a remake of 'E.T.'?",
          ["Koi Mil Gaya", "Krrish", "Jaane Kahan Se Aayi Hai", "PK"],
          0,
        ],
        [
          "Who played 'The Martian'?",
          ["Matt Damon", "Brad Pitt", "Matthew McConaughey", "Tom Cruise"],
          0,
        ],
        [
          "VFX heavy film about a fly?",
          ["Eega", "Makhi", "Both A & B", "Robot"],
          2,
        ],
        [
          "Which movie features a 'Flux Capacitor'?",
          ["Back to the Future", "Star Trek", "The Matrix", "Terminator"],
          0,
        ],
      ],
    },
    {
      quizNumber: 9,
      title: "Horror & Thrillers",
      questions: [
        [
          "Which Bollywood film is based on 'The Exorcist'?",
          ["Raat", "Raaz", "1920", "Bhoot"],
          0,
        ],
        [
          "Who directed 'Psycho'?",
          ["Alfred Hitchcock", "John Carpenter", "Wes Craven", "Tobe Hooper"],
          0,
        ],
        [
          "Vidya Balan's psychological thriller?",
          ["Bhool Bhulaiyaa", "Kahaani", "Both A & B", "No One Killed Jessica"],
          2,
        ],
        [
          "Which film features a killer clown named Pennywise?",
          ["IT", "Saw", "Scream", "Conjuring"],
          0,
        ],
        [
          "Ram Gopal Varma's famous horror film?",
          ["Bhoot", "Darna Mana Hai", "Raat", "All of the above"],
          3,
        ],
        [
          "Who directed 'The Sixth Sense'?",
          ["M. Night Shyamalan", "James Wan", "Ari Aster", "Jordan Peele"],
          0,
        ],
        [
          "Which movie is about a haunted hotel?",
          ["The Shining", "Psycho", "Hereditary", "Halloween"],
          0,
        ],
        [
          "Bollywood film about a spirit 'Manjulika'?",
          ["Bhool Bhulaiyaa", "Stree", "Raaz", "Roohi"],
          0,
        ],
        [
          "Who is the 'Master of Horror' in Hollywood?",
          ["John Carpenter", "Stephen King", "Wes Craven", "Alfred Hitchcock"],
          1,
        ],
        [
          "Sushmita Sen's thriller web series?",
          ["Aarya", "Delhi Crime", "Mirzapur", "Family Man"],
          0,
        ],
        [
          "Which film features a doll named Chucky?",
          ["Child's Play", "Annabelle", "Toy Story", "Small Soldiers"],
          0,
        ],
        [
          "Nawazuddin Siddiqui's serial killer film?",
          ["Raman Raghav 2.0", "Badlapur", "Kick", "Gangs of Wasseypur"],
          0,
        ],
        [
          "Who directed 'Get Out'?",
          ["Jordan Peele", "Spike Lee", "Tyler Perry", "Ryan Coogler"],
          0,
        ],
        [
          "Horror-comedy featuring Rajkummar Rao?",
          ["Stree", "Roohi", "Bhediya", "Ludo"],
          0,
        ],
        [
          "Which movie has the line 'I see dead people'?",
          ["The Sixth Sense", "The Others", "Insidious", "Poltergeist"],
          0,
        ],
      ],
    },
    {
      quizNumber: 10,
      title: "The modern OTT Era",
      questions: [
        [
          "Who played 'Ganesh Gaitonde' in Sacred Games?",
          [
            "Nawazuddin Siddiqui",
            "Saif Ali Khan",
            "Pankaj Tripathi",
            "Jitendra Kumar",
          ],
          0,
        ],
        [
          "Which series features 'The Professor'?",
          ["Money Heist", "Dark", "Narcos", "Stranger Things"],
          0,
        ],
        [
          "Pankaj Tripathi's character in Mirzapur?",
          ["Kaleen Bhaiya", "Munna Bhaiya", "Guddu Bhaiya", "Bablu Bhaiya"],
          0,
        ],
        [
          "Which platform produced 'Stranger Things'?",
          ["Netflix", "Amazon Prime", "Disney+", "Hulu"],
          0,
        ],
        [
          "Manoj Bajpayee's role in 'The Family Man'?",
          ["Srikant Tiwari", "JK Talpade", "Moosa", "Zulfiqar"],
          0,
        ],
        [
          "Who played 'Walter White' in Breaking Bad?",
          ["Bryan Cranston", "Aaron Paul", "Bob Odenkirk", "Dean Norris"],
          0,
        ],
        [
          "Jitendra Kumar's famous series about a village?",
          ["Panchayat", "Kota Factory", "TVF Pitchers", "Cubicles"],
          0,
        ],
        [
          "Which series is about a 'Zombie Apocalypse'?",
          ["The Walking Dead", "The Last of Us", "Both A & B", "Black Mirror"],
          2,
        ],
        [
          "Pratik Gandhi became famous for which role?",
          ["Harshad Mehta", "Vijay Mallya", "Nirav Modi", "Subrata Roy"],
          0,
        ],
        [
          "Who played 'Eleven' in Stranger Things?",
          ["Millie Bobby Brown", "Sadie Sink", "Maya Hawke", "Winona Ryder"],
          0,
        ],
        [
          "Bobby Deol's character in 'Aashram'?",
          ["Baba Nirala", "Bhakt Singh", "Tinka Singh", "Kashipur Waale"],
          0,
        ],
        [
          "Which series is based on the British royal family?",
          ["The Crown", "Succession", "Victoria", "The Great"],
          0,
        ],
        [
          "Kay Kay Menon's series about a RAW agent?",
          ["Special Ops", "The Freelancer", "Farzi", "Bambai Meri Jaan"],
          0,
        ],
        [
          "Who played 'Jon Snow' in Game of Thrones?",
          [
            "Kit Harington",
            "Richard Madden",
            "Nikolaj Coster-Waldau",
            "Peter Dinklage",
          ],
          0,
        ],
        [
          "Which web series is based on a UPSC coaching hub?",
          ["Aspirants", "Kota Factory", "Physics Wallah", "Sandeep Bhaiya"],
          0,
        ],
      ],
    },
  ];

  // 1. UPSERT CATEGORY
  const category = await prisma.category.upsert({
    where: { name: "Entertainment" },
    update: {},
    create: { name: "Entertainment" },
  });

  console.log(`📂 Category "${category.name}" ready.`);

  // 2. SEED LOOP
  for (const quiz of entertainmentData) {
    // Check if title already exists to avoid duplication
    const existingQuiz = await prisma.quiz.findFirst({
      where: { title: quiz.title, categoryId: category.id },
    });

    if (!existingQuiz) {
      await prisma.quiz.create({
        data: {
          title: quiz.title,
          quizNumber: quiz.quizNumber,
          timeLimit: 5,
          totalPoints: 60,
          categoryId: category.id,
          questions: {
            // Apply shuffling logic to every question
            create: quiz.questions.map((q) =>
              shuffleAndFormat(q[0] as string, q[1] as string[], q[2] as number)
            ),
          },
        },
      });
      console.log(`✅ Seeded Quiz ${quiz.quizNumber}: ${quiz.title}`);
    } else {
      console.log(`⏩ Skipped Quiz ${quiz.quizNumber} (Already exists)`);
    }
  }

  console.log("🏁 Entertainment Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
