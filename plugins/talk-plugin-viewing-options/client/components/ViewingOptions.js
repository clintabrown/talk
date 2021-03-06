import React from 'react';
import cn from 'classnames';
import styles from './ViewingOptions.css';
import {t} from 'plugin-api/beta/client/services';
import {Icon} from 'plugin-api/beta/client/components/ui';
import {Slot, ClickOutside} from 'plugin-api/beta/client/components';

const ViewingOptions = (props) => {
  const toggleOpen = () => {
    if (!props.open) {
      props.openMenu();
    } else {
      props.closeMenu();
    }
  };

  const handleClickOutside = () => {
    if (props.open) {
      props.closeMenu();
    }
  };

  return (
    <ClickOutside onClickOutside={handleClickOutside}>
      <div className={cn([styles.root, 'talk-plugin-viewing-options'])}>
        <div>
          <button className={styles.button} onClick={toggleOpen}>
            <Icon className={styles.filterIcon} name="filter_list" />
            <span className={styles.filterText}>{t('talk-plugin-viewing-options.viewing_options')}</span> 
            {props.open ? <Icon name="arrow_drop_up" className={styles.icon}/> : <Icon name="arrow_drop_down" className={styles.icon}/>}
          </button>
        </div>
        {
          props.open ? (
            <div className={cn([styles.list, 'talk-plugin-viewing-options-list'])}>
              <ul>
                {
                  React.Children.map(<Slot fill="viewingOptions" />, (component) => {
                    return React.createElement('li', {
                      className: 'talk-plugin-viewing-options-item'
                    }, component);
                  })
                }
              </ul>
            </div>
          ) : null
        }
      </div>
    </ClickOutside>
  );
};

export default ViewingOptions;
