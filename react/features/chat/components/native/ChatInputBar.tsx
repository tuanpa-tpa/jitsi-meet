import React, { Component } from 'react';
import { WithTranslation } from 'react-i18next';
import { Platform, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { translate } from '../../../base/i18n/functions';
import { IconSend } from '../../../base/icons/svg';
import IconButton from '../../../base/ui/components/native/IconButton';
import Input from '../../../base/ui/components/native/Input';
import { BUTTON_TYPES } from '../../../base/ui/constants.native';

import styles from './styles';
import { Stomp, Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { CMEET_ENV } from "../../ENV"
import { generateUUID } from '../../until/UUID';
import { LocalStorageHandle } from '../../../../../helper/LocalStorageHandler';

interface IProps extends WithTranslation {

    /**
     * Callback to invoke on message send.
     */
    onSend: Function;
    handleMessage: Function;
}

interface IState {

    /**
     * Boolean to show if an extra padding needs to be added to the bar.
     */
    addPadding: boolean;

    /**
     * The value of the input field.
     */
    message: string;

    /**
     * Boolean to show or hide the send button.
     */
    showSend: boolean;

}

/**
 * Implements the chat input bar with text field and action(s).
 */
class ChatInputBar extends Component<IProps, IState> {
    /**
     * Instantiates a new instance of the component.
     *
     * @inheritdoc
     */
    stompClient: any;
    meetingId: any;
    user: any;
    constructor(props: IProps) {
        super(props);

        this.state = {
            addPadding: false,
            message: '',
            showSend: false
        };

        this._onChangeText = this._onChangeText.bind(this);
        this._onFocused = this._onFocused.bind(this);
        this._onSubmit = this._onSubmit.bind(this);
        this.stompClient = new Client();
        this.stompClient.webSocketFactory = () => {
            return new SockJS(CMEET_ENV.urlWS);
        };
        this._oninit()
        this._onConnectWS();
    }
    _oninit() {
        this.user = new LocalStorageHandle("features/base/settings").getByKey()
        if(this.user.hasOwnProperty("id") || !this.user.id){
            this.user.id = generateUUID();
        }
        this.meetingId = window.location.href.split('/').at(-1)
    }

    async _onConnectWS() {
        this.stompClient.onConnect = (frame: any) => {
            this._onHandleMessage()
        };
        this.stompClient.activate();
    }


    _onSendChatCMeet(content: String) {
        if (this._isValidUUID(this.meetingId)) {
            this._publicStomp(CMEET_ENV.public, {
                content: content,
                sender: this.user.displayName,
                meetingId: this.meetingId,
                timeSheetId: null,
                userId: this.user.id,
                avatar: CMEET_ENV.avatar,
                fileExtension: null,
                filePath: null,
            })
        }
    }
    _publicStomp(destination: String, body: any) {
        this.stompClient.publish({
            destination: destination,
            body: JSON.stringify(body),
        });
    }
    _onHandleMessage() {
        this.stompClient.subscribe(CMEET_ENV.subrice, ({ body }: any) => {
            const data = JSON.parse(body);
            const { userId, meetingId } = data;
            if (data.meetingId == meetingId && this.user.id != userId) {
                this.props.handleMessage(data)
            }
        });
    }
    _isValidUUID(arg: any) {
        const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
        if (arg instanceof Array) {
            return arg.every(x => uuidRegex.test(x))
        }
        return uuidRegex.test(arg)
    }

    /**
     * Implements {@code Component#render}.
     *
     * @inheritdoc
     */
    render() {
        return (
            <SafeAreaView
                edges={['bottom']}
                style={[
                    styles.inputBar,
                    this.state.addPadding ? styles.extraBarPadding : null
                ] as ViewStyle[]}>
                <Input
                    blurOnSubmit={false}
                    customStyles={{ container: styles.customInputContainer }}
                    multiline={false}
                    onBlur={this._onFocused(false)}
                    onChange={this._onChangeText}
                    onFocus={this._onFocused(true)}
                    onSubmitEditing={this._onSubmit}
                    placeholder={this.props.t('chat.fieldPlaceHolder')}
                    returnKeyType='send'
                    value={this.state.message} />
                <IconButton
                    disabled={!this.state.message}
                    onPress={this._onSubmit}
                    src={IconSend}
                    style={styles.sendButton}
                    type={BUTTON_TYPES.PRIMARY} />
            </SafeAreaView>
        );
    }

    /**
     * Callback to handle the change of the value of the text field.
     *
     * @param {string} text - The current value of the field.
     * @returns {void}
     */
    _onChangeText(text: string) {
        this.setState({
            message: text,
            showSend: Boolean(text)
        });
    }

    /**
     * Constructs a callback to be used to update the padding of the field if necessary.
     *
     * @param {boolean} focused - True of the field is focused.
     * @returns {Function}
     */
    _onFocused(focused: boolean) {
        return () => {
            Platform.OS === 'android' && this.setState({
                addPadding: focused
            });
        };
    }

    /**
     * Callback to handle the submit event of the text field.
     *
     * @returns {void}
     */
    _onSubmit() {
        const message = this.state.message.trim();

        message && this.props.onSend(message);
        this.setState({
            message: '',
            showSend: false
        });
    }
}

export default translate(ChatInputBar);
