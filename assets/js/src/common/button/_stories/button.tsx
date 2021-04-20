import React from 'react';
import { action } from '_storybook/action';
import Button from '../button';
import Heading from '../../typography/heading/heading';

export default {
  title: 'Buttons',
  component: Button,
};

export const WithoutIcons = () => (
  <>
    <Heading level={3}>Small buttons</Heading>
    <p>
      <Button
        onClick={action('light small')}
        dimension="small"
        variant="light"
      >
        Light button
      </Button>
      <Button
        onClick={action('regular small')}
        dimension="small"
      >
        Regular button
      </Button>
      <Button
        onClick={action('link small')}
        dimension="small"
        variant="link"
      >
        Link button
      </Button>
    </p>
    <br />

    <Heading level={3}>Regular buttons</Heading>
    <p>
      <Button
        onClick={action('light regular')}
        variant="light"
      >
        Light button
      </Button>
      <Button
        onClick={action('regular regular')}
      >
        Regular button
      </Button>
      <Button
        onClick={action('link regular')}
        variant="link"
      >
        Link button
      </Button>
    </p>
    <br />

    <Heading level={3}>Large buttons</Heading>
    <p>
      <Button
        onClick={action('light large')}
        dimension="large"
        variant="light"
      >
        Light button
      </Button>
      <Button
        onClick={action('regular large')}
        dimension="large"
      >
        Regular button
      </Button>
      <Button
        onClick={action('link large')}
        dimension="large"
        variant="link"
      >
        Link button
      </Button>
    </p>
    <br />

    <Heading level={3}>Disabled buttons</Heading>
    <p>
      <Button
        onClick={action('light disabled')}
        isDisabled
        variant="light"
      >
        Light button
      </Button>
      <Button
        onClick={action('regular disabled')}
        isDisabled
      >
        Regular button
      </Button>
      <Button
        onClick={action('link disabled')}
        isDisabled
        variant="link"
      >
        Link button
      </Button>
    </p>
    <br />

    <Heading level={3}>Buttons with spinner</Heading>
    <p>
      <Button
        onClick={action('light spinner')}
        withSpinner
        variant="light"
      >
        Light button
      </Button>
      <Button
        onClick={action('regular spinner')}
        withSpinner
      >
        Regular button
      </Button>
      <Button
        onClick={action('link spinner')}
        withSpinner
        variant="link"
      >
        Link button
      </Button>
    </p>
    <br />

    <Heading level={3}>Full width buttons</Heading>
    <p>
      <Button
        onClick={action('light full-width ')}
        isFullWidth
        variant="light"
      >
        Light button
      </Button>
      <Button
        onClick={action('regular full-width ')}
        isFullWidth
      >
        Regular button
      </Button>
      <Button
        onClick={action('link full-width ')}
        isFullWidth
        variant="link"
      >
        Link button
      </Button>
    </p>
    <br />
  </>
);
