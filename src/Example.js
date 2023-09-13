import React, { useState, useRef, useEffect } from "react";
import { ReactMic } from "react-mic";
import WaveSurfer from "wavesurfer.js";

import { makeStyles } from "@material-ui/core/styles";
import MicIcon from "@material-ui/icons/Mic";
import IconButton from "@material-ui/core/IconButton";
import StopIcon from "@material-ui/icons/Stop";
import ReplayIcon from "@material-ui/icons/Replay";
import FiberManualRecordIcon from "@material-ui/icons/FiberManualRecord";
import DoneIcon from "@material-ui/icons/Done";
import CancelIcon from "@material-ui/icons/Cancel";
import PlayArrowIcon from "@material-ui/icons/PlayArrow";
import PauseIcon from "@material-ui/icons/Pause";

import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import Grid from "@material-ui/core/Grid";
import { green, red } from "@material-ui/core/colors";
import Fab from "@material-ui/core/Fab";
import CircularProgress from "@material-ui/core/CircularProgress";
import LinearProgress from "@material-ui/core/LinearProgress";
import { useTheme } from "@material-ui/styles";

//import ErrorMessage from '../Error/Error';
//import { CREATE_MESSAGE } from '../../graphql/mutations';

//import './microphone.css';

const useStyles = makeStyles(theme => ({
  icon: {
    height: 38,
    width: 38
  },
  reactmic: {
    width: "100%",
    height: 200
  },
  wavesurfer: {
    width: "100%"
  },
  flex: {
    flex: 1
  },
  fab: {},
  progress: {
    display: "block",
    margin: theme.spacing(2),
    width: "100%"
  },
  circularProgress: {
    marginBottom: theme.spacing(1)
  }
}));

const Microphone = () => {
  const theme = useTheme();
  const [record, setRecord] = useState(false);
  const [open, setOpen] = React.useState(false);
  const [tempFile, setTempFile] = React.useState(null);

  const [playerReady, setPlayerReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const wavesurfer = useRef(null);

  const [completed, setCompleted] = React.useState(0);
  const [secondsRemaining, setSecondsRemaining] = React.useState(0);

  const [createMessage, setCreateMessage] = useState(null);

  useEffect(() => {
    if (!record) {
      setSecondsRemaining(0);
      return;
    }

    const progressFn = () => {
      setSecondsRemaining(oldSecondsRemaining => {
        if (oldSecondsRemaining === 100) {
          setRecord(false);
          return 0;
        }
        return oldSecondsRemaining + 5; //0 to 100, for 20 sec
      });
    };

    const timer = setInterval(progressFn, 1000);
    return () => {
      clearInterval(timer);
    };
  }, [record]);

  useEffect(() => {
    if (!open || (open && !tempFile)) return;

    wavesurfer.current = WaveSurfer.create({
      container: "#wavesurfer-id",
      height: 140,
      cursorWidth: 1,
      barWidth: 2,
      normalize: true,
      responsive: true,
      fillParent: true
    });

    wavesurfer.current.on("ready", () => {
      setPlayerReady(true);
    });
    wavesurfer.current.on("play", () => setIsPlaying(true));
    wavesurfer.current.on("pause", () => setIsPlaying(false));
  }, [open, tempFile]);

  useEffect(() => {
    if (tempFile && wavesurfer.current) {
      wavesurfer.current.load(tempFile.blobURL);
    } else {
      wavesurfer.current = null;
      setTempFile(null);
    }
  }, [tempFile]);

  const togglePlayback = () => {
    if (!isPlaying) {
      wavesurfer.current.play();
    } else {
      wavesurfer.current.pause();
    }
  };
  const stopPlayback = () => wavesurfer.current.stop();

  const handleClickOpen = () => {
    setOpen(true);
  };

  const BlobURLToFile = async tempFile => {
    const response = await fetch(tempFile.blobURL);
    const data = await response.blob();
    const metadata = {
      type: "audio/webm"
    };
    const file = new File([data], "mic_recording.webm", metadata);
    return file;
  };

  const handleDone = async () => {
    let abort;
    if (tempFile) {
      try {
        const file = await BlobURLToFile(tempFile);

        await setCreateMessage(tempFile);

        setTempFile(null);
        setRecord(false);
        setOpen(false);
        setCompleted(0);
      } catch (error) {
        console.log(error);
      }
    }
  };

  const handleCancel = () => {
    setRecord(false);
    setTempFile(null);
    setOpen(false);
    setSecondsRemaining(0);
  };

  const startRecording = () => {
    setTempFile(null);
    setRecord(true);
  };

  const stopRecording = () => {
    setRecord(false);
  };

  const onData = recordedBlob => {
    //console.log("chunk of real-time data is: ", recordedBlob);
  };

  const onStop = recordedBlob => {
    setTempFile(recordedBlob);
  };

  const classes = useStyles();

  return (
    <>
      <Grid container justify="center">
        <Grid item>
          <Fab
            color="primary"
            className={classes.fab}
            onClick={handleClickOpen}
          >
            <MicIcon className={classes.icon} />
          </Fab>
        </Grid>
      </Grid>
      <Dialog maxWidth="sm" open={open} onClose={handleCancel}>
        <DialogTitle className={classes.flex}>
          {completed === 0 && record && (
            <span>
              {`Recording, ${6000 -
                Math.floor(secondsRemaining / 5)} seconds left`}
            </span>
          )}
          {completed === 0 && !record && <span>Record</span>}
          {completed > 0 && <span>{`Uploading ${completed}%`}</span>}
        </DialogTitle>
        <DialogContent>
          {tempFile ? (
            <div className={classes.wavesurfer} id="wavesurfer-id" />
          ) : (
            <ReactMic
              record={record}
              className={classes.reactmic}
              onStop={onStop}
              onData={onData}
              strokeColor="000000"
              backgroundColor="ffffff"
            />
          )}
        </DialogContent>
        <DialogActions>
          <Grid container>
            {record && (
              <Grid
                item
                container
                justify="center"
                xs={12}
                className={classes.circularProgress}
              >
                <CircularProgress variant="static" value={secondsRemaining} />
              </Grid>
            )}
            {tempFile && (
              <Grid item container justify="center" xs={12}>
                {!isPlaying ? (
                  <IconButton onClick={togglePlayback}>
                    <PlayArrowIcon className={classes.icon} />
                  </IconButton>
                ) : (
                  <IconButton onClick={togglePlayback}>
                    <PauseIcon className={classes.icon} />
                  </IconButton>
                )}
                <IconButton onClick={stopPlayback}>
                  <StopIcon className={classes.icon} />
                </IconButton>
              </Grid>
            )}
            <Grid item container justify="center" xs={12}>
              {!record && !tempFile && (
                <IconButton onClick={startRecording}>
                  <FiberManualRecordIcon
                    style={{ color: red[500] }}
                    className={classes.icon}
                  />
                </IconButton>
              )}

              {!record && tempFile && (
                <IconButton onClick={startRecording}>
                  <ReplayIcon className={classes.icon} />
                </IconButton>
              )}

              {record && (
                <IconButton onClick={stopRecording}>
                  <StopIcon className={classes.icon} />
                </IconButton>
              )}

              <IconButton onClick={handleDone}>
                <DoneIcon
                  style={tempFile && !record ? { color: green[500] } : {}}
                  className={classes.icon}
                />
              </IconButton>
              <IconButton onClick={handleCancel}>
                <CancelIcon
                  style={tempFile && !record ? { color: red[500] } : {}}
                  className={classes.icon}
                />
              </IconButton>
            </Grid>
            {completed > 0 && (
              <div className={classes.progress}>
                <LinearProgress variant="determinate" value={completed} />
              </div>
            )}
          </Grid>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Microphone;
