import * as React from 'react';

import {
	IAdSetupPostData,
	IOptionsMenuProps,
	ITranslatedProps,
	IWallPostPhotoOptimized,
} from '../../types';
import {
	getCameraMediaObjectMultiple,
	getGalleryMediaObjectMultiple,
	getOptimizedMediaObject,
	IPickerImageMultiple,
} from '../../utilities';
import { NewAdSetupPostScreenView } from './NewAdSetupPostScreen.view';

interface INewAdSetupPostScreenProps extends ITranslatedProps, IOptionsMenuProps {
	updateAdSetPost: (data: IAdSetupPostData) => void;
	adSetupPostFormik: React.RefObject<any>;
}

interface INewAdSetupPostScreenState {
	mediaObjects: IWallPostPhotoOptimized[];
}

export class NewAdSetupPostScreen extends React.Component<
	INewAdSetupPostScreenProps,
	INewAdSetupPostScreenState
> {
	public state = {
		mediaObjects: [],
	};

	public render() {
		const { getText, adSetupPostFormik } = this.props;
		const { mediaObjects } = this.state;
		return (
			<NewAdSetupPostScreenView
				adSetupPostFormik={adSetupPostFormik}
				mediaObjects={mediaObjects.map((mediaObject: IWallPostPhotoOptimized) => mediaObject.path)}
				getText={getText}
				onAddMedia={this.onAddMediaHandler}
				updateAdSetPost={this.updateAdSetPostHandler}
			/>
		);
	}

	private updateAdSetPostHandler = (headline: string, description: string) => {
		const { updateAdSetPost } = this.props;
		const { mediaObjects } = this.state;
		updateAdSetPost({ headline, description, mediaObjects });
	};

	private onAddMediaHandler = () => {
		const { showOptionsMenu, getText } = this.props;
		const menuItems = [
			{
				label: getText('new.wall.post.screen.menu.gallery'),
				icon: 'md-photos',
				actionHandler: () => this.addToScrollerSelectedMediaObject('gallery'),
			},
			{
				label: getText('new.wall.post.screen.menu.photo'),
				icon: 'md-camera',
				actionHandler: () => this.addToScrollerSelectedMediaObject('photo'),
			},
		];
		showOptionsMenu(menuItems);
	};

	private addToScrollerSelectedMediaObject = async (source: 'gallery' | 'photo') => {
		let selectedMediaObjects: IPickerImageMultiple = [];
		if (source === 'gallery') {
			selectedMediaObjects = await getGalleryMediaObjectMultiple();
		} else if (source === 'photo') {
			selectedMediaObjects = await getCameraMediaObjectMultiple();
		}
		if (selectedMediaObjects.length > 0) {
			const optimizedMediaObjects = await Promise.all(
				selectedMediaObjects.map(async (mObject) => getOptimizedMediaObject(mObject)),
			);
			this.setState({
				mediaObjects: [...this.state.mediaObjects, ...optimizedMediaObjects],
			});
		}
	};
}
