import React from 'react';
import axios from "axios";
import { Button, Form, TextArea } from 'semantic-ui-react'
import ChatList from './ChatList';
import { bindActionCreators } from 'redux';
import * as authActions from '../actions/Auth0Actions'
import * as authSelectors from '../auth/Auth0Selectors'
import { connect } from 'react-redux';
import moment from 'moment';

import BigCalendar from 'react-big-calendar';

BigCalendar.momentLocalizer(moment);

import 'react-big-calendar/lib/css/react-big-calendar.css';



class Chat extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      messages: [],
      message: '',
      engagementId: null,
      currentEvents: [],
    }
    this.changeId = this.changeId.bind(this);
    this.handleMessage = this.handleMessage.bind(this);
    this.updateChatHistory = this.updateChatHistory.bind(this);
    this.handleIdAndMessage = this.handleIdAndMessage.bind(this);
    this.seeSchedule = this.seeSchedule.bind(this);
    this.fetchSchedule = this.fetchSchedule.bind(this);
    this.momentDate = this.momentDate.bind(this);
  }

  changeId(){
    // this.setState({messages:[]})
    this.setState({engagementId: this.props.id}, () => {
      this.fetchSchedule();
    })
  }
  
  handleMessage(event) {
    event.preventDefault();
    this.setState({message: event.target.value});
  }
  
  updateChatHistory(event) {
    console.log(this.props)
    event.preventDefault();
    const config = {
      headers: {'Authorization': 'Bearer ' + localStorage.getItem('id_token'),
                'Content-Type': 'application/json' }
      };
    console.log(config)
    axios.post(API_ENDPOINT + "/api/messages", {
      "engagement_id": this.props.currentEngagement[0].id,
      "message": this.state.message
    }, config)
    .then(res => {
      console.log(res);
      this.props.fetchChatMessages(res.data.message);
      console.log('props in post req ', this.props.messages);
      // messages = this.props.messages;
      // console.log('messages in post req ', messages)
    })
    .catch(err => {
      if(err){
        console.log("there was err fetching data", err)
      }
    })
  }
  handleIdAndMessage(event) {
    this.handleMessage(event);
    // this.changeId();
  }
  postAppointments(sched) {
    const config = {
      headers: {'Authorization': 'Bearer ' + localStorage.getItem('id_token'),
        'Content-Type': 'application/json' }
    };
    axios.post(`${API_ENDPOINT}/api/schedules`, {start: sched.start, end: sched.end, user_id: this.state.engagementId }, config)
      .then((res) => {
        console.log(res,'response from posting appointment');
      })
      .catch((err) => {
        console.log(err, 'error from posting appointment');
      })
  }
  seeSchedule() {
    this.setState({engagementId: this.props.id}, () => {
      this.fetchSchedule();
      if(!this.state.engagementId) {
        alert('must select service provider first!');
      }
    });
  }
  momentDate(date) {
      const year = parseInt(date.substring(0,4)) -1;
      const month = parseInt(date.substring(5,7));
      const day = parseInt(date.substring(8,10))
      const hour = parseInt(date.substring(11,13))
      const minute  = parseInt(date.substring(14,16))
      return new Date(year, month, day, hour, minute, 0)
  }
  fetchSchedule() {
    console.log('fetch schedule is running');
    const config = {
      headers: {'Authorization': 'Bearer ' + localStorage.getItem('id_token'),
        'Content-Type': 'application/json' }
    };
    axios.get(`${API_ENDPOINT}/api/schedules/${this.state.engagementId}`, config)
      .then((res) => {
        console.log(res.data,'response from grabbing appointments');
        const momentDates = res.data.map((date) => {
          console.log('dates when fetch sched runs ', date);
          const event = {
            title: 'booked',
            start: this.momentDate(date.start),
            end: this.momentDate(date.end),
          }
          return event;
        });
        console.log(momentDates);
        this.setState({ currentEvents: momentDates });
      })
      .catch((err) => {
        console.log(err, 'error from grabbing appointments');
      })
  }
  render() {
    console.log(this.state, 'this is the state');
      return (
        <div className="chatbox">
          <ChatList messages={this.props.messages}/>
          <Form className="msgport" onSubmit={this.updateChatHistory} >
            <Form.Field onClick={this.changeId} onChange={this.handleIdAndMessage}  control={TextArea} label='Chat!' placeholder='Send em a message'  />
            <Form.Field control={Button}>Submit</Form.Field>
            <Form.Field onClick={this.seeSchedule} control={Button}>See service providers schedule</Form.Field>
          </Form>
          <div className={this.state.engagementId ? 'calendar' : 'hidden'  }>
            <BigCalendar
              selectable
              events={this.state.currentEvents}
              defaultView='week'
              scrollToTime={new Date()}
              defaultDate={new Date()}
              onSelectEvent={event => alert(event.title)}
              onSelectSlot={(slotInfo) => {
                  alert(
                    `selected slot: \n\nstart ${slotInfo.start.toLocaleString()} ` +
                    `\nend: ${slotInfo.end.toLocaleString()}`)
                  console.log('this is the slot info obj ', slotInfo);
                  console.log('this is the engagement id ', this.state.engagementId);
                  this.postAppointments(slotInfo);
                }
              }
            />
          </div>
        </div>
      )
  }
}

// export default Chat;

const mapStateToProps = (state) => {
  return {
    profile: authSelectors.getProfile(state),
  }
};

const mapDispatchToProps = (dispatch) => {
  return {
    actions: bindActionCreators({ ...authActions }, dispatch),
  }
};

export default connect(mapStateToProps, mapDispatchToProps)(Chat);
