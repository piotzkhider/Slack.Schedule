const qs = require('qs');
const axios = require('axios');
const {WebClient} = require('@slack/web-api');

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
  const body = qs.parse(event.body);
  const payload = JSON.parse(body.payload);

  try {
    await web.chat.deleteScheduledMessage({
      scheduled_message_id: payload.actions[0].value,
      channel: payload.channel.id,
    });
  } catch (err) {
    console.error(err);
  }

  try {
    await axios.post(payload.response_url, {
      replace_original: "true",
      text: ":relieved: This message has been deleted successfully."
    });

    return {
      statusCode: 200
    };
  } catch (err) {
    console.log(err);
    return err;
  }
};
