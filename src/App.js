import React, { useState } from 'react'
import styled from 'styled-components'
import { Table, Input, Select, Button, Spin, message, Typography, Space } from 'antd'
import { SearchOutlined, LinkOutlined } from '@ant-design/icons'
import axios from 'axios'
import QuantIcon from './QuantilytixO.png'
import BackgroundImage from './bg-image.jpg'
import {
  collection,
  addDoc,
  Timestamp,
  query,
  where,
  getDocs
} from 'firebase/firestore'
import { db } from '../src/firebase/firebaseConfig'

const { Title } = Typography
const { Option } = Select

const PageWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: url(${BackgroundImage}) repeat center center/cover;
  position: relative;
  padding: 20px;
`

const GlassContainer = styled.div`
  background: rgba(255, 255, 255, 0.2);
  border-radius: 15px;
  padding: 30px;
  width: 100%;
  max-width: 1000px;
  backdrop-filter: blur(15px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.3);
  margin-top: 32px;
`

const Logo = styled.img`
  position: absolute;
  bottom: 20px;
  right: 20px;
  width: 150px;
  height: auto;
  opacity: 0.9;
`

const App = () => {
  const [searchMode, setSearchMode] = useState('keywords')
  const [searchTerms, setSearchTerms] = useState('')
  const [searchURL, setSearchURL] = useState('')
  const [grants, setGrants] = useState([])
  const [loading, setLoading] = useState(false)

  const handleSearch = async () => {
    setLoading(true)
    const queryValue = searchMode === 'keywords' ? searchTerms.trim() : searchURL.trim()

    if (!queryValue) {
      message.warning('Please enter search terms or a URL.')
      setLoading(false)
      return
    }

    try {
      // Check Firestore cache
      const q = query(
        collection(db, 'grantQueries'),
        where('mode', '==', searchMode),
        where('query', '==', queryValue)
      )

      const snapshot = await getDocs(q)
      if (!snapshot.empty) {
        const cachedData = snapshot.docs[0].data()
        setGrants(cachedData.results || [])
        setLoading(false)
        return
      }

      // API call
      let response
      if (searchMode === 'keywords') {
        const termsArray = queryValue
          .split('\n')
          .map(term => term.trim())
          .filter(term => term)
        response = await axios.post(
          'https://rairo-qxgrants-api.hf.space/scrape',
          { search_terms: termsArray }
        )
      } else {
        response = await axios.post(
          'https://rairo-qxgrants-api.hf.space/scrape_url',
          { url: queryValue }
        )
      }

      const results = response?.data?.grants || []
      setGrants(results)
      if (results.length > 0) {
        await addDoc(collection(db, 'grantQueries'), {
          mode: searchMode,
          query: queryValue,
          timestamp: Timestamp.now(),
          results
        })
      }
    } catch (error) {
      console.error('Error fetching grants:', error)
      message.error('Failed to fetch grant data.')
    } finally {
      setLoading(false)
    }
  }

  // --- Antd Table columns ---
  const columns = [
    {
      title: 'Grant Name',
      dataIndex: 'Grant name/title',
      key: 'Grant name/title',
      render: text => text || 'N/A',
      width: 180
    },
    {
      title: 'Summary',
      dataIndex: 'Short summary',
      key: 'Short summary',
      render: text => text || 'N/A'
    },
    {
      title: 'Organization',
      dataIndex: 'Funding organization',
      key: 'Funding organization',
      render: text => text || 'N/A',
      width: 150
    },
    {
      title: 'Value',
      dataIndex: 'Grant value',
      key: 'Grant value',
      render: value =>
        typeof value === 'number'
          ? `$${value.toLocaleString()}`
          : value && value !== 'Not specified'
          ? value
          : 'N/A',
      width: 110
    },
    {
      title: 'Deadline',
      dataIndex: 'Application deadline',
      key: 'Application deadline',
      render: text => text || 'N/A',
      width: 100
    },
    {
      title: 'Countries',
      dataIndex: 'Eligible countries',
      key: 'Eligible countries',
      render: text => text || 'N/A',
      width: 120
    },
    {
      title: 'Sector',
      dataIndex: 'Sector/field',
      key: 'Sector/field',
      render: text => text || 'N/A',
      width: 120
    },
    {
      title: 'Explore',
      dataIndex: 'link URL',
      key: 'link URL',
      width: 100,
      render: url =>
        url && url !== 'Not specified'
          ? url.startsWith('http')
            ? (
              <a href={url} target='_blank' rel='noopener noreferrer'>
                <LinkOutlined /> Explore
              </a>
            ) : (
              <span>{url}</span>
            )
          : 'N/A'
    }
  ]

  return (
    <PageWrapper>
      <GlassContainer>
        <Title style={{ color: '#1677ff' }}>Quantilytix Grant Finder</Title>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Space>
            <Select
              value={searchMode}
              onChange={setSearchMode}
              style={{ width: 180 }}
            >
              <Option value="keywords">Search by Keywords</Option>
              <Option value="url">Search by URL</Option>
            </Select>
            <Input.TextArea
              rows={searchMode === 'keywords' ? 4 : 2}
              value={searchMode === 'keywords' ? searchTerms : searchURL}
              onChange={e =>
                searchMode === 'keywords'
                  ? setSearchTerms(e.target.value)
                  : setSearchURL(e.target.value)
              }
              placeholder={
                searchMode === 'keywords'
                  ? 'E.g., Renewable Energy Grants, Climate Change Research Grants'
                  : 'Paste a URL e.g. https://www.afdb.org/en/news-and-events/loans-grants'
              }
              style={{
                width: 350,
                background: 'rgba(255,255,255,0.8)'
              }}
              onPressEnter={e => {
                if (searchMode === 'url' || (searchMode === 'keywords' && e.ctrlKey)) handleSearch()
              }}
            />
            <Button
              icon={<SearchOutlined />}
              type="primary"
              loading={loading}
              onClick={handleSearch}
              style={{ fontWeight: 'bold' }}
            >
              Explore
            </Button>
          </Space>
          {loading ? (
            <Spin tip="Searching grants..." size="large" style={{ marginTop: 40 }} />
          ) : grants.length > 0 ? (
            <Table
              dataSource={grants}
              columns={columns}
              rowKey={(record, idx) =>
                record['Grant name/title'] + '-' + (record['Funding organization'] || idx)
              }
              scroll={{ x: 'max-content' }}
              bordered
              pagination={{ pageSize: 10 }}
              style={{ background: 'rgba(255,255,255,0.8)', borderRadius: 8 }}
            />
          ) : (
            <Typography.Text type="secondary" style={{ fontSize: 16 }}>
              😕 No grants found for your search. Try different terms.
            </Typography.Text>
          )}
        </Space>
      </GlassContainer>
      <Logo src={QuantIcon} alt='Quantilytix Logo' />
    </PageWrapper>
  )
}

export default App
