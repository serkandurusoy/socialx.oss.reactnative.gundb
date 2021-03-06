import * as React from 'react';
import { Dimensions, Image, StyleProp, ViewStyle } from 'react-native';
import FastImage from 'react-native-fast-image';
import ImageZoom from 'react-native-image-pan-zoom';
import * as mime from 'react-native-mime-types';

import { WithConfig } from '../../enhancers/connectors/app/WithConfig';

import { IVideoOptions, TouchableWithDoublePress, VideoPlayer } from '../';
import { IMediaTypes, IOnMove, MediaTypeImage, MediaTypeVideo } from '../../types';

import styles from './MediaObjectViewer.style';
const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

interface IMediaObjectViewerProps extends IVideoOptions {
	hash?: string;
	path?: string;
	dimensions?: {
		width: number;
		height: number;
	};
	extension?: string;
	fullscreen?: boolean;
	type?: IMediaTypes;
	defaultScale?: boolean;
	resizeMode?: 'cover' | 'contain' | 'stretch';
	style?: StyleProp<ViewStyle>;
	onPress?: () => void;
	onDoublePress?: () => void;
	onMove?: (position?: IOnMove) => void;
}

interface IProps extends IMediaObjectViewerProps {
	IPFS_URL: string;
}

interface IState {
	image: { width: number; height: number };
	uri: string;
	mimeType: string;
}

class Component extends React.Component<IProps, IState> {
	private ref = React.createRef<ImageZoom>();

	constructor(props: IProps) {
		super(props);

		const { dimensions, hash, path, type, extension, IPFS_URL } = props;
		const uri = path ? path : IPFS_URL + hash;

		this.state = {
			image: {
				width: dimensions ? dimensions.width : 0,
				height: dimensions ? dimensions.height : 0,
			},
			uri,
			mimeType: this.getMimeType(uri, type, extension),
		};
	}

	public componentDidMount() {
		if (this.state.image.height === 0 && this.state.image.width === 0) {
			const { uri, mimeType } = this.state;

			if (this.props.hash && mimeType.startsWith(MediaTypeImage.key)) {
				Image.getSize(
					uri,
					(width, height) => this.setState({ image: { width, height } }),
					(e) => console.log(e),
				);
			}
		}
	}

	public componentDidUpdate(prevProps: IProps) {
		if (prevProps.hash !== this.props.hash) {
			this.setState({ uri: this.props.IPFS_URL + this.props.hash });
		}
	}

	public render() {
		const {
			fullscreen,
			defaultScale,
			resizeMode,
			style,
			onPress,
			onDoublePress,
			onMove,
		} = this.props;
		const { uri, mimeType, image } = this.state;
		const heightRatio = SCREEN_WIDTH / this.state.image.width;

		return (
			<React.Fragment>
				{mimeType && mimeType.startsWith(MediaTypeImage.key) && (
					<TouchableWithDoublePress
						style={style}
						disabled={!onPress && !onDoublePress}
						onSinglePress={onPress}
						onDoublePress={onDoublePress}
					>
						{fullscreen && (
							<ImageZoom
								ref={this.ref}
								panToMove={defaultScale ? false : true}
								cropWidth={SCREEN_WIDTH}
								cropHeight={SCREEN_HEIGHT}
								imageWidth={SCREEN_WIDTH}
								imageHeight={image.height * heightRatio}
								onMove={onMove}
								onClick={this.onResetHandler}
							>
								<FastImage
									source={{ uri, priority: FastImage.priority.normal }}
									resizeMode={
										resizeMode === 'contain'
											? FastImage.resizeMode.contain
											: FastImage.resizeMode.cover
									}
									style={{
										width: SCREEN_WIDTH,
										height: image.height * heightRatio,
									}}
								/>
							</ImageZoom>
						)}
						{!fullscreen && (
							<FastImage
								source={{ uri, priority: FastImage.priority.normal }}
								resizeMode={
									resizeMode === 'contain'
										? FastImage.resizeMode.contain
										: FastImage.resizeMode.cover
								}
								style={styles.image}
							/>
						)}
					</TouchableWithDoublePress>
				)}
				{mimeType && mimeType.startsWith(MediaTypeVideo.key) && (
					<VideoPlayer uri={uri} resizeMode={resizeMode} containerStyle={style} />
				)}
			</React.Fragment>
		);
	}

	private getMimeType = (uri: string, type: IMediaTypes | undefined, extension?: string) => {
		if (type) {
			return type.key;
		} else if (extension) {
			if (mime.extensions[extension]) {
				return extension;
			}

			return mime.lookup('.' + extension);
		}

		return mime.lookup(uri);
	};

	private onResetHandler = () => {
		if (this.props.onPress && this.ref.current) {
			this.ref.current.reset();
			this.props.onPress();
		}
	};
}

export const MediaObjectViewer: React.SFC<IMediaObjectViewerProps> = (props) => (
	<WithConfig>
		{({ appConfig }) => <Component IPFS_URL={appConfig.ipfsConfig.ipfs_URL} {...props} />}
	</WithConfig>
);
