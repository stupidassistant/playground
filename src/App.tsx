import React from 'react';
import './App.css';
import SpeechRecognition from "react-speech-recognition";
import fetch from 'node-fetch';

type Props = {
  finalTranscript: string
  transcript: string,
  startListening: (config?: any) => void,
  resetTranscript: () => void,
  browserSupportsSpeechRecognition: boolean
};

type State = {
  list: {type: "self"|"ai", message: string}[]
};

class App extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      list: []
    }
  }

  scrollToBottom = () => {
    this.messagesEnd.scrollIntoView({ behavior: "smooth" });
  }

  componentDidMount() {
    if (!this.props.browserSupportsSpeechRecognition) {

    } else {
      this.props.startListening({continuous: false});
    }
    this.scrollToBottom();
  }
  
  componentDidUpdate() {
    this.scrollToBottom();
  }

  componentWillReceiveProps(nextProps: Props) {
    if (this.props.finalTranscript !== nextProps.finalTranscript && nextProps.finalTranscript.length !== 0) {
      this.onTranscriptionAppend(nextProps.finalTranscript);
      this.props.resetTranscript();
    }
  }

  appendTranscript(type: "self"|"ai", message: string) {
    this.setState({
      list: [...this.state.list, {type, message}]
    })
  }

  onTranscriptionAppend(transcript: string) {
    let a = this;
    this.setState({
      list: [...this.state.list, {type: "self", message: transcript}]
    }, function() {
      const details: Record<string, string> = {
        'query': transcript
      };

      const formBodyList: string[] = [];
      for (var property in details) {
        var encodedKey = encodeURIComponent(property);
        var encodedValue = encodeURIComponent(details[property]);
        formBodyList.push(encodedKey + "=" + encodedValue);
      }
      const formBody: string = formBodyList.join("&");

      fetch('https://api.stupidassistant.com/runQuery', {
        method: "post",
        body: formBody,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      })
        .then((v) => v.json())
        .then(function(res) {
          if (res.error)
            a.appendTranscript("ai", `I do not find anything for "${transcript}"`);
          else
            a.appendTranscript("ai", res.text);
        })
        .catch(function(res) {
          console.log(res);
        })
    });
  }

  private messagesEnd: any;

  render() {
    return (
      <div className="container">
        {this.state.list.map((v, i) => (
          <Message key={i} type={v.type} transcript={v.message} />
        ))}
        <Message type="self" transcript={this.props.transcript} />
        <div
          style={{ float:"left", clear: "both" }}
          ref={(el) => { this.messagesEnd = el; }}
        />
      </div>
    )
  }
};

function Message(props: {type: "self"|"ai", transcript: string}) {
  if (props.type === "self" && props.transcript.length === 0) {
    return (
      <div className="blinking-cursor" />
    )
  }
  return (
    <div className={props.type === "self" ? "messageSelf" : "messageAI"}>
      <p>{props.transcript}</p>
    </div>
  );
}

export default SpeechRecognition(App);
