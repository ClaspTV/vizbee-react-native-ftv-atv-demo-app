import {VizbeeAppDelegate} from "react-native-vizbee-receiver-sdk";
import {deeplinkHandler} from "../../utils/deeplinkHandler";
import {userManager} from "../../user/userManager";
import {appAPIConfig} from "../../api/appAPIConfig";
import {setRecoil} from "recoil-nexus";

export class MyAppVizbeeAppDelegate extends VizbeeAppDelegate {
    isAppReady: boolean;
    deferredStartVideo: any;
    isSignInInProgress: boolean;
    deferredSignInInfo: any;

    constructor() {
        super();

        this.isAppReady = false;
        this.deferredStartVideo = null;

        this.isSignInInProgress = false;
        this.deferredSignInInfo = null;
    }

    /*
     * This method is invoked by the Vizbee SDK every time the mobile device connects to the TV.
     * Handles the user sign-in process. This method checks if the application is ready and if a sign-in is already in progress. 
     * If the app is not ready or a sign-in is in progress, it defers the sign-in information for later processing. 
     * If the user is already signed in, it exits early. 
     * If the sign-in is initiated, it updates the user data and fetches the authentication token from the server, 
     * subsequently handling the response to either show a welcome message or start deferred video playback.
     */
    onSignIn(signInInfo) {
        
        if (!this.isAppReady || this.isSignInInProgress) {
            this.deferredSignInInfo = signInInfo;
            return;
        }

        const isSignedIn = !!userManager.isSignedIn();
        if (isSignedIn) {
            return;
        }

        this.isSignInInProgress = true;
        const {uid, uidSignature, signatureTimestamp} = signInInfo || {};
        userManager.setData({
            UID: uid,
            UIDSignature: uidSignature,
            signatureTimestamp,
        });
        appAPIConfig.getAuthToken()
            .then((_authToken) => {
                userManager.fetchSignInFromServer()
                    .then((_payload) => {
                        this._showToastWithUserName();
                        this.isSignInInProgress = false;
                        this._startDeferredVideo();
                    })
                    .catch((_error) => {
                        this.isSignInInProgress = false;
                        this._startDeferredVideo();
                    });
            })
            .catch((_authTokenError) => {
                this.isSignInInProgress = false;
                this._startDeferredVideo();
            });
    }

    /**
     * This method is invoked by the Vizbee SDK for every video that the user selects to cast.
     * It checks the app's readiness and ensures no sign-in process is in progress before attempting to play the video.
     * If the app is not ready or a sign-in is in progress, it defers the video start. Otherwise, it generates a deep link URL
     * based on the video information and attempts to play the video using the deep link.
     * 
     * @param videoInfo The information about the video to be played, including its GUID, title, start position, and live status.
     */
    onStartVideo(videoInfo) {

        // sanity
        if (!videoInfo) {
            return;
        }
        
        // Check if the app is ready and not in the middle of signing in.
        // If not ready or signing in, defer the video start.
        if (!this.isAppReady || this.isSignInInProgress) {
            this.deferredStartVideo = videoInfo;
            return;
        }

        // generate a deep link URL based on video info.
        const getDeeplinkUrl = () => {
            const {
                guid,
                customMetadata = {},
                title,
                startPosition,
                isLive,
            } = videoInfo || {};

            if (isLive) {
                return `/livestream/${guid}`;
            } else {
                return `/vod/${guid}`;
            }
        };

        // deep link video
        const deeplinkUrl = getDeeplinkUrl();
        deeplinkHandler({url: deeplinkUrl});
    }

    /**
     * This method is invoked by the Vizbee SDK when the first sender connects to the receiver.
     * It can be used to handle any necessary actions when the first sender connects to the receiver.
     */
    onSendersActive() {
        
    }

    /**
     * This method is invoked by the Vizbee SDK when the last sender disconnects from the receiver.
     * It can be used to handle any necessary actions when the last sender disconnects from the receiver.
     */
    onSendersInactive() {
        
    }
    
    /**
     * This method should be invoked whenever the app is ready.
     * It updates the app's readiness state and triggers any deferred actions.
     * 
     * @param isAppReady Boolean indicating if the app is ready.
     */
    setIsAppReady(isAppReady) {
        this.isAppReady = isAppReady;
        if (this.isAppReady) {
            if (this.deferredSignInInfo) {
                this._startDeferredSignIn();
            } else {
                this._startDeferredVideo();
            }
        }
    }

    _startDeferredSignIn() {
        if (this.deferredSignInInfo) {
            this.onSignIn(this.deferredSignInInfo);
            this.deferredSignInInfo = null;
        }
    }

    _startDeferredVideo() {
        if (this.deferredStartVideo) {
            this.onStartVideo(this.deferredStartVideo);
            this.deferredStartVideo = null;
        }
    }

    _showToastWithUserName() {
        const userName =
            userManager.data?.profile?.firstName || "Mobile User";
        setRecoil(toastState, {
            duration: 10000,
            message: `Welcome ${userName}!`,
            position: ToastPositionEnum.BottomRight,
        });
    }
}

export default MyAppVizbeeAppDelegate;