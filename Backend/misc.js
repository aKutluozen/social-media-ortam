/*
    Some common functions are contained here
    */

var misc = module.exports;

misc.notifyUser = function (response, userModel, currentUserId, postId, otherUserNickName, type) {
    userModel.updateOne({ nickName: otherUserNickName }, {
        $push: {
            $position: 0,
            inbox: {
                action: type,
                post: postId,
                user: currentUserId,
                date: Date.now()
            }
        }
    }, (err, user) => {
        if (err || !user) {
            return response.status(500).json({
                message: 'problem updating user',
                error: err
            });
        }
        return response.status(200).json({
            message: 'user notified',
            data: user
        });
    });
}

// For complaint
misc.notifyUsers = function (userModel, currentUserId, data, otherUserNickName, type, callback) {
    userModel.updateOne({ nickName: otherUserNickName }, {
        $push: {
            $position: 0,
            inbox: {
                action: type,
                post: null,
                data: data,
                user: currentUserId,
                date: Date.now()
            }
        }
    }, (err, user) => {
        callback();
    });
}

misc.removeNotification = function (response, userModel, currentUserId, postId, otherUserNickName, type) {
    userModel.updateOne({ nickName: otherUserNickName }, {
        $pull: {
            inbox: {
                action: type,
                post: postId,
                user: currentUserId,
            }
        }
    }, (err, user) => {
        if (err || !user) {
            return response.status(500).json({
                message: 'problem removing notification',
                error: err
            });
        }
        return response.status(200).json({
            message: 'user notification removed',
            data: user
        });
    });
}

// Use for general cases
misc.checkResultErrors = function (error, response, type, data) {
    if (error) {
        return response.status(500).json({
            message: 'An error occured finding ' + type,
            error: error
        });
    }
    
    if (!data) {
        return response.status(500).json({
            message: 'No ' + type,
            error: 'No ' + type
        });
    }
}

// Use when authentication is needed
misc.checkUserErrors = function (error, response, user, token, callback) {
    if (error) {
        return response.status(500).json({
            message: 'An error occured',
            error: error
        });
    }

    if (!user) {
        return response.status(500).json({
            message: 'No user found',
            error: 'No message'
        });
    }

    if (token) {
        if (user._id != token.id) {
            return response.status(401).json({
                message: 'No authentication',
                error: 'Users do not match'
            });
        }
    }

    callback();
}