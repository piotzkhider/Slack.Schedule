exports.IncorrectFormatResponse = {
  statusCode: 200,
  body: JSON.stringify({
    response_type: 'ephemeral',
    attachments: [
      {
        color: '#e61b42',
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: "*Oops! Your message is not in the correct format*\nEx:\n`/schedule` Happy Birthday! at 11:59pm\n`/schedule` Happy Birthday! at 23:59"
            },
          }
        ]
      }
    ]
  })
};

exports.UnverifiedResponse = {
  statusCode: 403
};

