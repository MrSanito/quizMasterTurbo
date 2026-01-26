"use client";
import React from "react";
import { useState } from "react";
import { string } from "zod";

const TestPage = () => {
  const data = {
    _id: "cmk1ayubl004aigtxw711u9pp",
    quizNumber: 1,
    title: "Physics & Chemistry",
    categoryId: "cmk1ayu320049igtxszitm8ko",
    timeLimit: 15,
    totalPoints: 60,
    questions: [
      {
        _id: "cmk1ayuoi004bigtxyk1gygnr",
        questionText: "SI unit of force?",
        points: 4,
        negativePoints: -1,
        options: [
          {
            _id: "cmk1ayuwx004eigtx4dx62pfa",
            text: "Pascal",
            isCorrect: false,
          },
          {
            _id: "cmk1ayuwx004figtxdfpd3h5f",
            text: "Watt",
            isCorrect: false,
          },
          {
            _id: "cmk1ayuwx004digtxly9sj2i2",
            text: "Joule",
            isCorrect: false,
          },
          {
            _id: "cmk1ayuwx004cigtxf4qq6eoj",
            text: "Newton",
            isCorrect: true,
          },
        ],
      },
      {
        _id: "cmk1ayv5g004gigtx95g5hndu",
        questionText: "H2O is?",
        points: 4,
        negativePoints: -1,
        options: [
          {
            _id: "cmk1ayvdz004higtxv6op9lzg",
            text: "Water",
            isCorrect: true,
          },
          {
            _id: "cmk1ayvdz004kigtxchch59hb",
            text: "Salt",
            isCorrect: false,
          },
          {
            _id: "cmk1ayvdz004iigtxhng144c1",
            text: "Hydrogen",
            isCorrect: false,
          },
          {
            _id: "cmk1ayvdz004jigtxoykuz3x7",
            text: "Oxygen",
            isCorrect: false,
          },
        ],
      },
      {
        _id: "cmk1ayvmi004ligtxrxutcs7a",
        questionText: "Atomic number = ?",
        points: 4,
        negativePoints: -1,
        options: [
          {
            _id: "cmk1ayvv2004oigtxi55i7duk",
            text: "Electrons",
            isCorrect: false,
          },
          {
            _id: "cmk1ayvv2004migtxtpx45ieb",
            text: "Protons",
            isCorrect: true,
          },
          {
            _id: "cmk1ayvv2004pigtxbw0447i6",
            text: "Mass",
            isCorrect: false,
          },
          {
            _id: "cmk1ayvv2004nigtxavnsjfa0",
            text: "Neutrons",
            isCorrect: false,
          },
        ],
      },
      {
        _id: "cmk1ayw3l004qigtxn4cfgsev",
        questionText: "Speed formula?",
        points: 4,
        negativePoints: -1,
        options: [
          {
            _id: "cmk1aywc5004uigtx9r8r4bby",
            text: "Force/Time",
            isCorrect: false,
          },
          {
            _id: "cmk1aywc5004rigtxmsh6ko2t",
            text: "Distance/Time",
            isCorrect: true,
          },
          {
            _id: "cmk1aywc5004sigtxvn9cad4a",
            text: "Time/Distance",
            isCorrect: false,
          },
          {
            _id: "cmk1aywc5004tigtx0eworh7c",
            text: "Mass/Force",
            isCorrect: false,
          },
        ],
      },
      {
        _id: "cmk1aywko004vigtx7kgatcsd",
        questionText: "pH of neutral?",
        points: 4,
        negativePoints: -1,
        options: [
          {
            _id: "cmk1aywt7004yigtxeaofoxn4",
            text: "14",
            isCorrect: false,
          },
          {
            _id: "cmk1aywt7004wigtxyrlxlocn",
            text: "7",
            isCorrect: true,
          },
          {
            _id: "cmk1aywt7004xigtxfb5xwaaz",
            text: "0",
            isCorrect: false,
          },
          {
            _id: "cmk1aywt7004zigtxj52jnvjw",
            text: "5",
            isCorrect: false,
          },
        ],
      },
      {
        _id: "cmk1ayx1v0050igtxxmx38a93",
        questionText: "Gas for respiration?",
        points: 4,
        negativePoints: -1,
        options: [
          {
            _id: "cmk1ayxiu0053igtxeqmwi4b8",
            text: "Nitrogen",
            isCorrect: false,
          },
          {
            _id: "cmk1ayxiu0052igtxge9h3k52",
            text: "Carbon",
            isCorrect: false,
          },
          {
            _id: "cmk1ayxiu0054igtxxuxc39nq",
            text: "Helium",
            isCorrect: false,
          },
          {
            _id: "cmk1ayxiu0051igtxf8fcc3td",
            text: "Oxygen",
            isCorrect: true,
          },
        ],
      },
      {
        _id: "cmk1ayxrc0055igtxkb9tikpp",
        questionText: "Metal liquid at RT?",
        points: 4,
        negativePoints: -1,
        options: [
          {
            _id: "cmk1ayy440058igtxefc55a11",
            text: "Zinc",
            isCorrect: false,
          },
          {
            _id: "cmk1ayy440057igtxqqpsmzmk",
            text: "Lead",
            isCorrect: false,
          },
          {
            _id: "cmk1ayy440056igtx9d413b3c",
            text: "Mercury",
            isCorrect: true,
          },
          {
            _id: "cmk1ayy440059igtxpf9d90lc",
            text: "Iron",
            isCorrect: false,
          },
        ],
      },
      {
        _id: "cmk1ayygx005aigtxxb052qs8",
        questionText: "Heat transfer via waves?",
        points: 4,
        negativePoints: -1,
        options: [
          {
            _id: "cmk1ayypg005cigtx7p18o3ws",
            text: "Conduction",
            isCorrect: false,
          },
          {
            _id: "cmk1ayypg005bigtxjqu2u2s3",
            text: "Radiation",
            isCorrect: true,
          },
          {
            _id: "cmk1ayypg005eigtxunwcyol2",
            text: "Fusion",
            isCorrect: false,
          },
          {
            _id: "cmk1ayypg005digtxnqve29g7",
            text: "Convection",
            isCorrect: false,
          },
        ],
      },
      {
        _id: "cmk1ayyxz005figtxlbr85msv",
        questionText: "Light bending?",
        points: 4,
        negativePoints: -1,
        options: [
          {
            _id: "cmk1ayz6j005iigtxj4l0bcfe",
            text: "Diffusion",
            isCorrect: false,
          },
          {
            _id: "cmk1ayz6j005jigtxic5mxi2a",
            text: "Dispersion",
            isCorrect: false,
          },
          {
            _id: "cmk1ayz6j005higtxym46gcg3",
            text: "Reflection",
            isCorrect: false,
          },
          {
            _id: "cmk1ayz6j005gigtx618985lh",
            text: "Refraction",
            isCorrect: true,
          },
        ],
      },
      {
        _id: "cmk1ayzf2005kigtxe2evhevj",
        questionText: "Energy unit?",
        points: 4,
        negativePoints: -1,
        options: [
          {
            _id: "cmk1ayznl005ligtxjmrg6e28",
            text: "Joule",
            isCorrect: true,
          },
          {
            _id: "cmk1ayznl005migtx7xdvbz4y",
            text: "Watt",
            isCorrect: false,
          },
          {
            _id: "cmk1ayznl005nigtx0gtm4zyo",
            text: "Volt",
            isCorrect: false,
          },
          {
            _id: "cmk1ayznl005oigtxrhyxvjrc",
            text: "Ampere",
            isCorrect: false,
          },
        ],
      },
      {
        _id: "cmk1ayzw5005pigtx1cqmkoxn",
        questionText: "Electron charge?",
        points: 4,
        negativePoints: -1,
        options: [
          {
            _id: "cmk1az094005sigtx8gs1nzdl",
            text: "Neutral",
            isCorrect: false,
          },
          {
            _id: "cmk1az094005tigtxvu5lf624",
            text: "Variable",
            isCorrect: false,
          },
          {
            _id: "cmk1az094005rigtxke1wwbdg",
            text: "Positive",
            isCorrect: false,
          },
          {
            _id: "cmk1az094005qigtx7w6wiwz5",
            text: "Negative",
            isCorrect: true,
          },
        ],
      },
      {
        _id: "cmk1az0lr005uigtxwlfwfuqt",
        questionText: "Earth gravity ~?",
        points: 4,
        negativePoints: -1,
        options: [
          {
            _id: "cmk1az0yj005yigtxp6aw0ss3",
            text: "12.2",
            isCorrect: false,
          },
          {
            _id: "cmk1az0yj005vigtxhn050bs6",
            text: "9.8 m/s²",
            isCorrect: true,
          },
          {
            _id: "cmk1az0yj005wigtxh7jpc23g",
            text: "8.9",
            isCorrect: false,
          },
          {
            _id: "cmk1az0yj005xigtxnx80zkcc",
            text: "10.5",
            isCorrect: false,
          },
        ],
      },
      {
        _id: "cmk1az173005zigtxc0lws08l",
        questionText: "Boiling water °C?",
        points: 4,
        negativePoints: -1,
        options: [
          {
            _id: "cmk1az1fm0060igtx91r9ul75",
            text: "100",
            isCorrect: true,
          },
          {
            _id: "cmk1az1fm0062igtxytszxssb",
            text: "80",
            isCorrect: false,
          },
          {
            _id: "cmk1az1fm0061igtxletepdnz",
            text: "90",
            isCorrect: false,
          },
          {
            _id: "cmk1az1fm0063igtxmadu2sm7",
            text: "120",
            isCorrect: false,
          },
        ],
      },
      {
        _id: "cmk1az1o50064igtxn3km252i",
        questionText: "Chemical bond sharing?",
        points: 4,
        negativePoints: -1,
        options: [
          {
            _id: "cmk1az1wo0067igtxj4f5ggis",
            text: "Metallic",
            isCorrect: false,
          },
          {
            _id: "cmk1az1wp0068igtxbua073s8",
            text: "Hydrogen",
            isCorrect: false,
          },
          {
            _id: "cmk1az1wo0066igtxcrk75q3i",
            text: "Ionic",
            isCorrect: false,
          },
          {
            _id: "cmk1az1wo0065igtxqmplfes0",
            text: "Covalent",
            isCorrect: true,
          },
        ],
      },
      {
        _id: "cmk1az2590069igtxcqu9q3sn",
        questionText: "Gas law PV=?",
        points: 4,
        negativePoints: -1,
        options: [
          {
            _id: "cmk1az2dq006cigtx3mwcn5ld",
            text: "nT",
            isCorrect: false,
          },
          {
            _id: "cmk1az2dq006digtx7jry78ly",
            text: "PR",
            isCorrect: false,
          },
          {
            _id: "cmk1az2dq006bigtxbtrscdi9",
            text: "RT",
            isCorrect: false,
          },
          {
            _id: "cmk1az2dq006aigtxaxdu0a0t",
            text: "nRT",
            isCorrect: true,
          },
        ],
      },
    ],
  };

  const [started, setStarted] = useState<boolean>();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(1);
  const [score, setScore] = useState<number>(0);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState();
  const [isAnswered, setIsAnswered] = useState<boolean>(false);

  const handleNextQuestion = () => {
    console.log("handle next question");
    setIsAnswered(false);

    setCurrentQuestionIndex((prev) => prev + 1);
  };

  const handleOptionSelect = (idx) => {
    const q = data.questions[currentQuestionIndex];
    const selectedOption = q.options[idx];
    const correctOption = q.options.find((option) => {
      return (option.isCorrect = true);
    });

    setSelectedOptionIndex(idx);
    setIsAnswered(true);

    setScore((prev) => selectedOption === correctOption ? prev + 4 : prev -1)

    console.log("selectedOption", selectedOption);
    console.log("correct Option", correctOption);
    console.log("selected option index is ", idx);
  };

  console.log(data);

  if (!started) {
    return (
      <div className=" max-h-[80dvh] flex justify-center items-center">
        <div>not started screen</div>

        <button
          onClick={(e) => {
            setStarted(true);
          }}
          className="btn"
        >
          ChangeStart Screen
        </button>
      </div>
    );
  }

  const currentQuestion = data.questions[currentQuestionIndex];
  return (
    <div>
      <div className="h-16 border">
        total question {currentQuestionIndex + 1}/ {data.questions.length}
        <div>{score}</div>
      </div>

      <div>
        <p>question ={currentQuestion.questionText} </p>
        <h3>options</h3>

        {currentQuestion.options.map((option, index) => {
          const isSelected = selectedOptionIndex === index;
          return (
            <div key={index} className="">
              <button
                className="btn btn-primary"
                disabled={isAnswered}
                onClick={() => handleOptionSelect(index)}
              >
                {index + 1} {option.text}
              </button>
              {isSelected ? "fahhh" : "nahhh"}
            </div>
          );
        })}

        {isAnswered ? (
          <button
            className="btn btn-active text-success"
            onClick={handleNextQuestion}
          >
            Next Question{" "}
          </button>
        ) : (
          " "
        )}
      </div>
      <div>QuizScreen</div>
    </div>
  );
};

export default TestPage;
