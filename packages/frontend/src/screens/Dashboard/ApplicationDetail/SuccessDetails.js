import React, { useCallback, useMemo, useState } from 'react'
import { useHistory } from 'react-router-dom'
import { useQuery } from 'react-query'
import axios from 'axios'
import { useViewport } from 'use-viewport'
import Styled from 'styled-components/macro'
import * as Sentry from '@sentry/react'
import {
  Button,
  ButtonBase,
  CircleGraph,
  DataView,
  Spacer,
  Split,
  textStyle,
  useTheme,
  useToast,
  GU,
  TextCopy,
} from '@pokt-foundation/ui'
import AppStatus from '../../../components/AppStatus/AppStatus'
import Box from '../../../components/Box/Box'
import FloatUp from '../../../components/FloatUp/FloatUp'
import { log } from '../../../lib/utils'
import env from '../../../environment'
import { KNOWN_QUERY_SUFFIXES } from '../../../known-query-suffixes'
import { sentryEnabled } from '../../../sentry'

const DEFAULT_FILTERED_STATE = {
  failedRelays: [],
  successfulRelays: [],
}
const FAILED_RELAYS_KEY = 'failedRelays'
const SUCCESSFUL_RELAYS_KEY = 'successfulRelays'

export default function SuccessDetails({
  id,
  isLb,
  maxDailyRelays,
  stakedTokens,
  successfulRelays,
  totalRelays,
}) {
  const [activeKey, setActiveKey] = useState(SUCCESSFUL_RELAYS_KEY)
  const theme = useTheme()
  const toast = useToast()
  const { within } = useViewport()

  const compactMode = within(-1, 'medium')

  const { isLoading, data } = useQuery(
    [KNOWN_QUERY_SUFFIXES.LATEST_FILTERED_DETAILS, id, isLb],
    async function getFilteredRelays() {
      const successfulPath = `${env('BACKEND_URL')}/api/${
        isLb ? 'lb' : 'applications'
      }/latest-successful-relays`
      const failingPath = `${env('BACKEND_URL')}/api/${
        isLb ? 'lb' : 'applications'
      }/latest-failing-relays`

      if (!id) {
        return DEFAULT_FILTERED_STATE
      }

      try {
        const { data: successfulData } = await axios.post(
          successfulPath,
          {
            id,
          },
          {
            withCredentials: true,
          }
        )

        const { data: failedData } = await axios.post(
          failingPath,
          {
            id,
          },
          {
            withCredentials: true,
          }
        )

        return {
          successfulRelays: successfulData.session_relays,
          failedRelays: failedData.session_relays,
        }
      } catch (err) {
        if (sentryEnabled) {
          Sentry.configureScope((scope) => {
            scope.setTransactionName(
              KNOWN_QUERY_SUFFIXES.LATEST_FILTERED_DETAILS
            )
          })
          Sentry.captureException(err)
        }
        log('SUCCESS DETAILS ERROR', Object.entries(err))
        throw err
      }
    },
    {
      keepPreviousData: true,
    }
  )

  const onSuccessfulClick = useCallback(
    () => setActiveKey(SUCCESSFUL_RELAYS_KEY),
    []
  )
  const onFailedClick = useCallback(() => setActiveKey(FAILED_RELAYS_KEY), [])
  const successRate = useMemo(() => {
    return totalRelays === 0 ? 0 : successfulRelays / totalRelays
  }, [totalRelays, successfulRelays])
  const failureRate = useMemo(() => {
    return totalRelays === 0
      ? 0
      : (totalRelays - successfulRelays) / totalRelays
  }, [successfulRelays, totalRelays])

  const displayData = useMemo(() => {
    if (activeKey === SUCCESSFUL_RELAYS_KEY) {
      return data?.successfulRelays ?? []
    } else {
      return data?.failedRelays ?? []
    }
  }, [activeKey, data])

  return (
    <FloatUp
      loading={false}
      content={() => (
        <Split
          primary={
            <>
              {compactMode && (
                <>
                  <NavigationOptions />
                  <Spacer size={3 * GU} />
                </>
              )}
              <Box padding={[3 * GU, 4 * GU, 3 * GU, 4 * GU]}>
                <div
                  css={`
                    display: flex;
                    flex-direction: row;
                    justify-content: space-between;
                    width: 100%;
                    height: 100%;
                    ${compactMode &&
                    `
                      flex-direction: column;
                    `}
                  `}
                >
                  <div
                    css={`
                      display: flex;
                      flex-direction: column;
                    `}
                  >
                    <h2
                      css={`
                        ${textStyle('title1')}
                      `}
                    >
                      {Intl.NumberFormat().format(totalRelays)}
                      <span
                        css={`
                          display: block;
                          ${textStyle('title3')}
                        `}
                      >
                        Total requests
                      </span>
                      <span
                        css={`
                          ${textStyle('body3')}
                        `}
                      >
                        Last 24 hours
                      </span>
                    </h2>
                  </div>
                  <Inline>
                    <CircleGraph
                      value={Math.min(successRate, 1)}
                      size={12 * GU}
                      color={theme.positive}
                    />
                    <Spacer size={1 * GU} />
                    <div>
                      <h2
                        css={`
                          ${textStyle('title2')}
                        `}
                      >
                        {Intl.NumberFormat().format(
                          Math.min(successfulRelays, totalRelays)
                        )}
                        <span
                          css={`
                            display: block;
                            ${textStyle('body3')}
                          `}
                        >
                          Processed requests
                        </span>
                      </h2>
                      <h2
                        css={`
                          ${textStyle('title3')}
                        `}
                      >
                        Successful Requests
                      </h2>
                    </div>
                  </Inline>
                  {compactMode && <Spacer size={3 * GU} />}
                  <Inline>
                    <CircleGraph
                      value={Math.max(0, failureRate)}
                      size={12 * GU}
                      color={theme.negative}
                    />
                    <Spacer size={1 * GU} />
                    <div>
                      <h2
                        css={`
                          ${textStyle('title2')}
                        `}
                      >
                        {Intl.NumberFormat().format(
                          Math.max(totalRelays - successfulRelays, 0)
                        )}
                        <span
                          css={`
                            display: block;
                            ${textStyle('body3')}
                          `}
                        >
                          Failed Requests
                        </span>
                      </h2>
                      <h2
                        css={`
                          ${textStyle('title3')}
                        `}
                      >
                        Failure rate
                      </h2>
                    </div>
                  </Inline>
                </div>
              </Box>
              <Spacer size={3 * GU} />
              <Box padding={[0, 0, 0, 0]}>
                <div
                  css={`
                    display: flex;
                    justify-content: space-between;
                  `}
                >
                  <Spacer size={2 * GU} />
                  <Tab
                    active={activeKey === SUCCESSFUL_RELAYS_KEY}
                    onClick={onSuccessfulClick}
                  >
                    Successful requests
                  </Tab>
                  <Tab
                    active={activeKey === FAILED_RELAYS_KEY}
                    onClick={onFailedClick}
                  >
                    Failed requests
                  </Tab>
                  <Spacer size={3 * GU} />
                </div>
                <Spacer size={5 * GU} />
                <DataView
                  fields={[
                    '',
                    'Request type',
                    'Bytes transferred',
                    'Service Node',
                  ]}
                  entries={displayData}
                  renderEntry={({ bytes, method, nodePublicKey }) => {
                    return [
                      <div
                        css={`
                          display: inline-block;
                          width: ${1.5 * GU}px;
                          height: ${1.5 * GU}px;
                          border-radius: 50% 50%;
                          background: ${activeKey === SUCCESSFUL_RELAYS_KEY
                            ? theme.positive
                            : theme.negative};
                          box-shadow: ${activeKey === SUCCESSFUL_RELAYS_KEY
                              ? theme.positive
                              : theme.negative}
                            0px 2px 8px 0px;
                        `}
                      />,
                      <p>{method ? method : 'Unknown'}</p>,
                      <p>{bytes}B</p>,
                      <TextCopy
                        value={nodePublicKey}
                        onCopy={() => toast('Node address copied to cliboard')}
                        css={`
                          width: 100%;
                          > div > input {
                            background: transparent;
                          }
                        `}
                      />,
                    ]
                  }}
                  status={isLoading ? 'loading' : 'default'}
                />
              </Box>
            </>
          }
          secondary={
            <>
              {!compactMode && (
                <>
                  <NavigationOptions />

                  <Spacer size={2 * GU} />
                </>
              )}
              <AppStatus
                maxDailyRelays={maxDailyRelays}
                stakedTokens={stakedTokens}
              />
            </>
          }
        />
      )}
    />
  )
}

function NavigationOptions() {
  const history = useHistory()

  return (
    <Button wide mode="primary" onClick={() => history.goBack()}>
      Back to application
    </Button>
  )
}

function Tab({ active, children, onClick }) {
  const theme = useTheme()

  return (
    <ButtonBase
      onClick={onClick}
      css={`
        && {
          position: relative;
          height: ${6 * GU}px;
          width: 100%;
          border-radius: 0 0 ${1 * GU}px ${1 * GU}px;
          color: ${theme.content};
          ${textStyle('body3')}
          ${active &&
          `
          background: #091828;
          border-top: 2px solid ${theme.accent};
          color: white;
          transition: all 0.080s ease-in;
        `};
        }
      `}
    >
      {children}
    </ButtonBase>
  )
}

const Inline = Styled.div`
  display: flex;
  align-items: center;
`
