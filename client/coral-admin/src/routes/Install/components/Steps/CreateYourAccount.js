import React from 'react';
import styles from './style.css';
import {TextField, Button, Spinner} from 'coral-ui';

import t from 'coral-framework/services/i18n';

const InitialStep = (props) => {
  const {handleUserChange, handleUserSubmit, install} = props;
  return (
    <div className={styles.step}>
      <div className={styles.form}>
        <form onSubmit={handleUserSubmit}>
          <TextField
            className={styles.textField}
            id="email"
            type="email"
            label={t('install.create.email')}
            onChange={handleUserChange}
            showErrors={install.showErrors}
            errorMsg={install.errors.email}
            noValidate
            />

          <TextField
            className={styles.textField}
            id="username"
            type="text"
            label={t('install.create.username')}
            onChange={handleUserChange}
            showErrors={install.showErrors}
            errorMsg={install.errors.username}
            />

          <TextField
            className={styles.textField}
            id="password"
            type="password"
            label={t('install.create.password')}
            onChange={handleUserChange}
            showErrors={install.showErrors}
            errorMsg={install.errors.password}
            />

          <TextField
            className={styles.textField}
            id="confirmPassword"
            type="password"
            label={t('install.create.confirm_password')}
            onChange={handleUserChange}
            showErrors={install.showErrors}
            errorMsg={install.errors.confirmPassword}
            />

          {
            !props.install.isLoading ?
            <Button cStyle='black' type="submit" full>{t('install.create.save')}</Button>
            :
            <Spinner />
          }
          {props.install.installRequest === 'FAILURE' && <div className={styles.error}>Error: {props.install.installRequestError}</div>}
        </form>
      </div>
    </div>
  );
};

export default InitialStep;
