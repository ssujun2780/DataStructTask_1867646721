from richCompat import Console
from event.Event import Event
import independentEvent.printInfo as pI

import random
from gameData import clear_screen, config, pause, text


def _friend_text(event_id, field, **values):
    return text("eventText", "friendEvent", event_id, field, **values)


def _capture_friend_info(connectable_friends):
    original_console = pI.console
    temp_console = Console(record=True, width=100)

    try:
        pI.console = temp_console
        pI.printFriendInfo(connectable_friends)
        return temp_console.export_text()
    finally:
        pI.console = original_console


def callFriend(friend):
    connectable_friends = [f for f in friend if f.isConnect]

    if not connectable_friends:
        event = Event(
            _friend_text("call", "title"),
            _friend_text("call", "noFriend"),
            [_friend_text("call", "back")],
        )
        event.occurEvent()
        return None

    title = _friend_text("call", "title")
    content = _capture_friend_info(connectable_friends)
    options = [
        _friend_text("call", "contactOption", friend_name=i.name)
        for i in connectable_friends
    ]
    options.append(_friend_text("call", "back"))

    event = Event(title, content, options)
    select = event.occurEvent()

    if select == len(connectable_friends) + 1:
        return None

    return connectable_friends[select - 1]


def _checkPlayAcceptance(friend):
    favor = friend.favorability

    chance = next(
        item["chance"]
        for item in config("friend", "playAcceptance")
        if favor >= item["minFavor"]
    )

    return random.random() < chance


def playWithFriend(player, friend):
    accepted = _checkPlayAcceptance(friend)

    clear_screen()
    playConfig = config("friend", "play")

    if accepted:
        print(_friend_text("play", "accepted", friend_name=friend.name))
        player.changeCurrentHealth(playConfig["health"])
        player.changeStress(playConfig["stress"])
        print(
            _friend_text(
                "play",
                "recovered",
                health=abs(playConfig["health"]),
                stress=abs(playConfig["stress"]),
            )
        )

        friend.changeFavorability(playConfig["favor"])
        print(
            _friend_text(
                "play",
                "favorUp",
                friend_name=friend.name,
                favor_delta=playConfig["favor"],
            )
        )

        if random.random() < playConfig["forgetChance"]:
            player.changeIntelligence(playConfig["forgetIntelligence"])
            print(
                _friend_text(
                    "play",
                    "forgot",
                    intelligence_delta=abs(playConfig["forgetIntelligence"]),
                )
            )

        pause()
        return player

    print(_friend_text("play", "rejected", friend_name=friend.name))
    player.changeStress(playConfig["rejectStress"])
    print(_friend_text("play", "rejectStress", stress_delta=playConfig["rejectStress"]))
    pause()
    return player


def suddenRelationChange(friend):
    clear_screen()
    relationConfig = config("friend", "relationChange")
    if friend.favorability <= relationConfig["maxFavor"]:
        roll = random.random()
        if roll <= relationConfig["badChance"]:
            friend.changeFavorability(-relationConfig["amount"])
            print(
                _friend_text(
                    "relationChange",
                    "bad",
                    friend_name=friend.name,
                    amount=relationConfig["amount"],
                )
            )
            pause()
            clear_screen()
        elif relationConfig["badChance"] < roll <= relationConfig["goodChance"]:
            friend.changeFavorability(relationConfig["amount"])
            print(
                _friend_text(
                    "relationChange",
                    "good",
                    friend_name=friend.name,
                    amount=relationConfig["amount"],
                )
            )
            pause()
            clear_screen()
    return friend


def adviceStudyFriendEvent(player, friend):
    clear_screen()
    if friend.intelligence > config("friend", "advice", "studyMinIntelligence") and friend.intelligence >= player.intelligence:
        title = _friend_text("adviceStudy", "title", friend_name=friend.name)
        content = _friend_text("adviceStudy", "content", friend_name=friend.name)
        options = [
            _friend_text("adviceStudy", "accept", intelligence_delta=3, favor_delta=1),
            _friend_text("adviceStudy", "reject", favor_delta=1),
        ]

        select = Event(title, content, options).occurEvent()

        if select == 1:
            player.changeIntelligence(3)
            friend.changeFavorability(1)
            friend.changeIntelligence(10)
        else:
            friend.changeFavorability(-1)
            friend.changeIntelligence(5)
    clear_screen()
    return player, friend


def adviceExerciseFriendEvent(player, friend):
    clear_screen()
    if friend.maxHealth > config("friend", "advice", "exerciseMinHealth"):
        title = _friend_text("adviceExercise", "title", friend_name=friend.name)
        content = _friend_text("adviceExercise", "content", friend_name=friend.name)
        options = [
            _friend_text(
                "adviceExercise",
                "accept",
                health_delta=5,
                max_health_delta=3,
                favor_delta=1,
            ),
            _friend_text("adviceExercise", "reject", favor_delta=1),
        ]

        select = Event(title, content, options).occurEvent()

        if select == 1:
            player.changeMaxHealth(3)
            player.changeCurrentHealth(-5)
            friend.changeFavorability(1)
            friend.changeMaxHealth(10)
        else:
            friend.changeFavorability(-1)
            friend.changeMaxHealth(5)
        clear_screen()
    return player, friend


def advicePlayFriendEvent(player, friends):
    clear_screen()
    connectableFriends = [f for f in friends if f.isConnect is True]
    if not connectableFriends:
        return player, friends, 0
    friend = random.choice(connectableFriends)
    if random.random() < config("friend", "advice", "playChance"):
        title = _friend_text("advicePlay", "title", friend_name=friend.name)
        content = _friend_text("advicePlay", "content", friend_name=friend.name)
        options = [
            _friend_text(
                "advicePlay",
                "accept",
                health_delta=5,
                stress_delta=10,
                favor_delta=3,
            ),
            _friend_text("advicePlay", "reject", favor_delta=3),
        ]

        select = Event(title, content, options).occurEvent()

        if select == 1:
            player.changeStress(-5)
            player.changeCurrentHealth(-5)
            friend.changeFavorability(3)
        else:
            friend.changeFavorability(-3)

        eventCheck = 1
    else:
        eventCheck = 0
    return player, friend, eventCheck
