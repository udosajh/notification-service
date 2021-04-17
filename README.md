# notification-service
send notification daily, weekly, monthly and annually to users.

# Send Adhoc Notification

- method
    - POST
- Input
    - user_id: string
    - notification_medium_type: NotificationMediumType
    - msg: string
- Output
    - when successfully message sent
        - http status 200
        - message sent
    - when validation error occurs
        - http status code 400
        - validation error message
    - when internal server error occurred
        - http status code 500
        - Oops something went wrong! please try again after some time

# Poll Service

- Collection / table Name => NotificationMediumType
- Message Status
    - Queued
        - when microservice is trying to send this notification to the user
    - AVAILABLE
        - when notification is available for sending it to the user
    - FAILED
        - due to some reason, message could not be delivered
    - SENT
        - when micro service sends notification to user

- In this we are polling at each Message status
    - Poll "AVAILABLE" message status
        - run a transaction
            - fetch all the notifications which have status as SUBSCRIBED, message status is AVAILABLE
            - update all notification status to QUEUED and return updated notifications
        - send these updated notification to send service
        - then save notification with either SENT or FAILED status depending on which notification got delivered

    - Poll QUEUED message status
        - update all notifications where notification status is subscribed, message status is QUEUED and queued_time is less than (current time - ALLOWED_QUEUED_INTERVAL) to AVAILABLE status

    - Poll FAILED
        - fetch all the FAILED notifications, raise alarm

    - Poll for SENT message status
        - update message to AVAILABLE where last sent time is less than current time - (offset) and message status is SENT and notification status is subscribed
            - offset
                - EVERY_DAY
                    - 24 * 60 * 60
                - EVERY_WEEK
                    - 7 * 24 * 60 * 60
                - EVERY_YEAR
                    - 365 * 24 * 60 * 60
                - EVERY_MONTH
                    - 30 * 24 * 60 * 60
    ### TODO
        - add ALARM_RAISED status in message status
        - add QUEUED_FOR_ALARM status in message status