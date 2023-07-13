import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import cloneDeep from "lodash/cloneDeep";
import styles from "./styles.module.css";
import "./style.css";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import * as io from "../../socket/socket";
import axios from "axios";
import board1 from "../../boardImages/board1.jpg";
import board2 from "../../boardImages/board2.jpg";
import board3 from "../../boardImages/board3.png";
import board4 from "../../boardImages/board4.jpg";
import board5 from "../../boardImages/board5.jpg";
import board6 from "../../boardImages/board6.jpeg";

function Game() {
  const boards = [board1, board2, board3, board4, board5, board6];
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const [progress, setProgress] = React.useState(0);
  const gameId = useRef(null);
  let [game, setGame] = useState(null);
  let [turnUpdate, setturnUpdate] = useState(null);
  const [msg, setMsg] = useState("The game is Loading");
  let diceRef = useRef(null);
  let rollRef = useRef(null);
  let [timer, setTimer] = useState(Date.now());
  let [lastPlayTime, setLastPlayTime] = useState(Date.now());
  const [t, setT] = useState(false);

  useEffect(() => {
    const headers = {
      "x-access-token": sessionStorage.getItem("authenticated"),
    };
    axios
      .get(`/currentGame`, { headers: headers })
      .then((res) => {
        console.log("RESPONSE RECEIVED: ", res);
        gameId.current = res.data.Id;
        console.log("Id: " + gameId.current);
        io.subscribeToRoom(gameId.current, handleTurnUpdate, handleRoomUpdate);
      })
      .catch((err) => {
        console.log("AXIOS ERROR: ", err);
        navigate("/");
      });
  }, []);

  useEffect(() => {
    if (
      game &&
      game.game_status.toLowerCase() === "active" &&
      (timer - lastPlayTime) / 1000.0 <= 10
    ) {
      setProgress((timer - lastPlayTime) / 1000.0);
    }
  }, [timer]);

  useEffect(() => {
    if (game && turnUpdate) {
      console.log("??????????????????");
      let x = cloneDeep(game);
      x.game_status = turnUpdate?.game_status;
      x.pending_player_index = turnUpdate?.pending_player_index;
      x.lastPlayTime = turnUpdate?.pending_player_index;
      x.players[turnUpdate?.move.player_index].position = turnUpdate?.move.to;
      setGame(x);
      setMsg(`It's ${x.players[turnUpdate?.pending_player_index].name}'s turn`);
      if (!t) {
        setInterval(() => {
          // if (game && game.game_status.toLowerCase() === "active") {
          setTimer((p) => p + 1000);
          // }
        }, 1000);
        setT(true);
      }
    }
  }, [turnUpdate]);

  const handleTurnUpdate = (gameTurnObject) => {
    if (typeof gameTurnObject === "string") {
      setMsg(gameTurnObject);
      return;
    }
    rollDice(gameTurnObject.move.dice_outcome);
    setTimeout(() => {
      setturnUpdate(gameTurnObject);
    }, 1000);
    console.log(gameTurnObject);
    const { lastPlayTime } = gameTurnObject;
    setLastPlayTime(lastPlayTime);
    setTimer(lastPlayTime);
  };

  const handleRoomUpdate = (gameObject) => {
    if (typeof gameObject === "string") {
      setMsg(gameObject);
      return;
    }
    console.log("gameObject");
    console.log(gameObject);
    setGame(gameObject);
    // drawCanvas(gameObject);
  };
  function rollDice(elComeOut) {
    var elDiceOne = diceRef?.current;
    if(elDiceOne){
      for (let i = 1; i <= 6; i++) {
        elDiceOne.classList.remove("show-" + i);
        console.log(elComeOut, i);
        if (elComeOut == i) {
          elDiceOne.classList.add("show-" + i);
          console.log(elDiceOne.classList);
        }
      }
  }
  }
  const pos = (pos_1) => {
    const pos_0 = pos_1 - 1;
    const y = 9 - Math.floor(pos_0 / 10);
    let x = pos_0 % 10;
    if (y % 2 == 0) {
      x = 9 - x;
    }
    return { x, y };
  };
  useEffect(() => {
    //
    if (diceRef.current && rollRef.current && canvasRef.current) {
      drawCanvas(game);
      var elComeOut = rollRef.current;
      console.log(elComeOut);

      elComeOut.onclick = function () {
        console.log(
          game.players[game.pending_player_index].name,
          sessionStorage.getItem("username")
        );
        // if (
        //   game.players[game.pending_player_index].name ==
        //   sessionStorage.getItem("username")
        // ) {
        //   io.rollDice(gameId);
        // }
        io.rollDice(gameId.current);
      };
    }
  }, [diceRef.current, rollRef.current, canvasRef.current]);
  /*
  {
      game_status: gameStatus,
      pending_player_index: next_player_index,
      lastPlayTime: t,
      move: {
          player_index: last_player_index,
          dice_outcome: dice,
          from: oldPosition,
          to: newPos
      }
  }
  */
  useEffect(() => {
    if (game && turnUpdate) {
      const { from, to, dice_outcome, player_index } = turnUpdate.move;
      let newPlayersObject = [...game.players];
      newPlayersObject[player_index].position = from + dice_outcome;
      let gameObject = {
        ...game,
        players: [...newPlayersObject],
      };
      console.log("hiii");
      drawCanvas(gameObject);
      if (from + dice_outcome != to) {
        setTimeout(() => {
          gameObject.players[player_index].position = to;
          drawCanvas(game);
        }, 500);
      }
    }
  }, [game]);

  let drawCanvas = (game) => {
    console.log(game, "mmmmmmmmmm");
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const img = new Image();
    //img.src = `./assets/board${game.board_id}.jpg`;
    img.src = boards[game.board_id - 1];
    img.onload = function () {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const cellW = canvas.width / 10.0;
      const cellH = canvas.height / 10.0;
      //draw pieces:
      for (const p of game.players) {
        if (p.position === 0) {
          continue;
        }
        const { x, y } = pos(p.position);

        ctx.beginPath();
        ctx.arc(
          x * cellW + cellW / 2.0,
          y * cellH + cellH / 2.0,
          cellW / 3.0,
          0,
          2 * Math.PI
        );
        ctx.fillStyle = "white";
        ctx.fill();

        ctx.beginPath();
        ctx.arc(
          x * cellW + cellW / 2.0,
          y * cellH + cellH / 2.0,
          cellW / 3.3,
          0,
          2 * Math.PI
        );
        ctx.fillStyle = p.color;
        ctx.fill();
      }
    };
  };

  const leaveGame = (e) => {
    e.preventDefault();
    console.log("lol" + gameId.current);
    const headers = {
      "x-access-token": sessionStorage.getItem("authenticated"),
    };
    axios
      .post(
        `/leaveGame`,
        { gameId: parseInt(gameId.current) },
        { headers: headers }
      )
      .then((res) => {
        console.log("RESPONSE RECEIVED: ", res);
        window.location.reload(true);
      })
      .catch((err) => {
        console.log("AXIOS ERROR: ", err);
      });
  };

  return (
    <>
      {!game ? null : (
        <div className={styles.gameContainer}>
          <div className={styles.playersList}>
            <table className={styles.playersTable}>
              <thead>
                <th>Player</th>
                <th>Position</th>
              </thead>
              <tbody>
                {game?.players?.map((player) => (
                  <tr
                    className={styles.player}
                    style={{
                      color:
                        player.name ==
                        game.players[game.pending_player_index].name
                          ? "rgb(141, 206, 206)"
                          : "black",
                    }}
                  >
                    <td>
                      <div>{player.name}</div>
                      <div
                        className={styles.playerColor}
                        style={{ backgroundColor: player.color }}
                      ></div>
                    </td>
                    <td>{player.position}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <canvas ref={canvasRef} width={749} height={749} />

          <div className={styles.timerDiceContainer}>
            <button className="leaveGame" onClick={(e) => leaveGame(e)}>
              Leave
            </button>
            <div className="msg" id="msssg">
              {msg}
            </div>
            <div className={styles.timer}>
              <Box sx={{ position: "relative", display: "inline-flex" }}>
                <CircularProgress
                  variant="determinate"
                  value={(progress / 10) * 100}
                  style={{
                    width: "150px",
                    height: "150px",
                    color: "rgb(141, 206, 206)",
                    backgroundColor: "#fff",
                    borderRadius: "50%",
                  }}
                />
                <Box
                  sx={{
                    top: 0,
                    left: 0,
                    bottom: 0,
                    right: 0,
                    position: "absolute",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Typography
                    variant="caption"
                    component="div"
                    color="text.secondary"
                    style={{
                      fontSize: "4rem",
                      color: "black",
                      fontFamily: "Bungee",
                    }}
                  >
                    {`${progress}`}
                  </Typography>
                </Box>
              </Box>
            </div>

            <div ref={rollRef}>
              <div className="dice dice-one" ref={diceRef}>
                <div id="dice-one-side-one" className="side one">
                  <div className="dot one-1"></div>
                </div>
                <div id="dice-one-side-two" className="side two">
                  <div className="dot two-1"></div>
                  <div className="dot two-2"></div>
                </div>
                <div id="dice-one-side-three" className="side three">
                  <div className="dot three-1"></div>
                  <div className="dot three-2"></div>
                  <div className="dot three-3"></div>
                </div>
                <div id="dice-one-side-four" className="side four">
                  <div className="dot four-1"></div>
                  <div className="dot four-2"></div>
                  <div className="dot four-3"></div>
                  <div className="dot four-4"></div>
                </div>
                <div id="dice-one-side-five" className="side five">
                  <div className="dot five-1"></div>
                  <div className="dot five-2"></div>
                  <div className="dot five-3"></div>
                  <div className="dot five-4"></div>
                  <div className="dot five-5"></div>
                </div>
                <div id="dice-one-side-six" className="side six">
                  <div className="dot six-1"></div>
                  <div className="dot six-2"></div>
                  <div className="dot six-3"></div>
                  <div className="dot six-4"></div>
                  <div className="dot six-5"></div>
                  <div className="dot six-6"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Game;
