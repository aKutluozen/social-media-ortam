/*
    Some common functions are contained here
    */

var misc = module.exports;

misc.savePost = function (message, res) {
    message.save(function (err, result) {
        if (err) {
            return res.status(500).json({
                title: 'An error occured',
                error: err
            });
        }

        res.status(200).json({
            message: 'Post updated!',
            obj: result[result.length - 1]
        });
    });
}

misc.saveUser = function (user, res) {
    user.save(function (err, result) {
        if (err) {
            return res.status(500).json({
                title: 'An error occured',
                error: err
            });
        }
        res.status(200).json({
            message: 'Profile image deleted!',
            filename: ''
        });
    });
}

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
        if (err || !user) response.status(500).json({});
        response.status(200).json({});
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
        console.log(err, user);
        callback();
    });
}
// $pull: { likes: { $in: [req.params.name] } }

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
        if (err || !user) response.status(500).json({});
        response.status(200).json({});
    });
}

misc.checkResultErrors = function (err, post, type, res) {
    if (err) {
        return res.status(500).json({
            title: 'An error occured finding ' + type,
            error: err
        });
    }

    if (!post) {
        return res.status(500).json({
            title: 'No ' + type,
            error: {
                message: 'No ' + type
            }
        });
    }
}

misc.checkUserErrors = function (response, err, user, decoded, callback) {
    if (err) {
        return response.status(500).json({
            title: 'An error occured',
            error: err
        });
    }

    if (!user) {
        return response.status(500).json({
            title: 'No user found',
            error: {
                message: 'No message'
            }
        });
    }

    if (decoded) {
        if (user._id != decoded.id) {
            return response.status(401).json({
                title: 'No authentication',
                error: {
                    message: 'Users do not match'
                }
            });
        }
    }

    callback();
}