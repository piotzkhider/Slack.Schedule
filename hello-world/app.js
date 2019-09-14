const P = require('parsimmon');
const R = require('ramda');
const qs = require('qs');
const {WebClient} = require('@slack/web-api');
const response = require('./response');
const {Verify} = require('./utils');

const web = new WebClient(process.env.SLACK_TOKEN);

/**
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Context doc: https://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-context.html
 * @param {Object} context
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 *
 */
exports.lambdaHandler = async (event, context) => {
  const Sherlock = require('sherlockjs');

  const body = qs.parse(event.body);

  if (!Verify(body.token)) {
    return response.UnverifiedResponse
  }

  if (!validate(body.text)) {
    return response.IncorrectFormatResponse
  }

  const CLI = P.createLanguage({
    Expression: r =>
      P.seqMap(
        r.Message, r.Whitespace, r.Time,
        (_1, _2, _3) => R.reduce((acc, x) => R.mergeRight({[x.name]: x.value})(acc), {}, [_1, _3])
      ),
    Whitespace: () => P.whitespace,
    At: () => P.string('at'),
    Eof: () => P.eof,
    Message: () => {
      let val = P.regex(/^([\s\S]+)\s+at\s+((1[0-2]|0?[1-9])(:([0-5]\d))?[ap][m]|([01]?\d|2[0-3]):[0-5]\d)$/i, 1).tryParse(body.text);
      return P.string(val).node('message');
    },
    Time: r =>
      P.seqMap(
        r.At, r.Whitespace, P.regex(/((1[0-2]|0?[1-9])(:([0-5]\d))?[ap][m]|([01]?\d|2[0-3]):[0-5]\d)/i), r.Eof,
        (_1, _2, _3) => _3
      ).node('time'),
  });

  let parsed;
  try {
    parsed = CLI.Expression.tryParse(body.text);
  } catch (err) {
    console.error(err);
    return response.IncorrectFormatResponse
  }

  const message = parsed.message;
  const date = Sherlock.parse(parsed.time).startDate;
  const timestamp = Math.floor(date.getTime() / 1000);

  try {
    const resp = await web.chat.scheduleMessage({
      channel: body.channel_id,
      text: parsed.message,
      post_at: timestamp,
      as_user: true,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        response_type: 'ephemeral',
        attachments: [
          {
            color: '#fec958',
            blocks: [
              {
                type: 'section',
                text: {
                  type: 'mrkdwn',
                  text: `*I'll send your message at <!date^${timestamp}^ {time} {date_pretty}|Posted ${date.toLocaleString()} JST>*\n${message}`
                },
              },
              {
                type: "actions",
                block_id: "cancel",
                elements: [
                  {
                    type: "button",
                    text: {
                      type: "plain_text",
                      text: "Cancel"
                    },
                    value: resp.scheduled_message_id,
                    style: 'danger',
                    confirm: {
                      title: {
                        type: "plain_text",
                        text: "Are you sure?"
                      },
                      text: {
                        type: "plain_text",
                        text: "This message will be canceled."
                      },
                      deny: {
                        type: "plain_text",
                        text: "No"
                      },
                      confirm: {
                        type: "plain_text",
                        text: "Yes"
                      }
                    }
                  }
                ]
              }
            ]
          }
        ]
      })
    };
  } catch (err) {
    console.log(err);
    return err;
  }
};

const validate = (text) => {
  try {
    P.regex(/^([\s\S]+)\s+at\s+((1[0-2]|0?[1-9])(:([0-5]\d))?[ap][m]|([01]?\d|2[0-3]):[0-5]\d)$/i, 1).tryParse(text);
    return true
  } catch (err) {
    console.error(err);
    return false
  }
};
