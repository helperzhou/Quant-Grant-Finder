import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import axios from 'axios';
import QuantIcon from './QuantilytixO.png';
import BackgroundImage from './bg-image.jpg';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../src/firebase/firebaseConfig';

const PageWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: url(${BackgroundImage}) repeat center center/cover;
  position: relative;
  padding: 20px;
`;

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
`;

const Title = styled.h2`
    color: #fff;
    font-size: 24px;
  margin-bottom: 15px;
`;

const UrlInput = styled.textarea`
  width: 100%;
  height: 100px;
  padding: 12px;
  border: none;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(20px);
  font-size: 16px;
  color: black;
  resize: none;
  outline: none;
  margin-bottom: 15px;

  &::placeholder {
    color: rgba(0, 0, 0, 0.5);
  }
`;

const clickEffect = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(0.95); }
  100% { transform: scale(1); }
`;

const SearchButton = styled.button`
  width: 100%;
  padding: 12px;
  background: ${({ loading }) => (loading ? 'rgba(100, 100, 100, 0.8)' : 'rgba(0, 123, 255, 0.8)')};
  color: white;
  font-size: 16px;
  font-weight: bold;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.3s ease-in-out, transform 0.1s ease-in-out;
  animation: ${({ clicked }) => (clicked ? clickEffect : 'none')} 0.2s ease-in-out;
  margin-bottom: 20px;

  &:hover {
    background: ${({ loading }) => (loading ? 'rgba(100, 100, 100, 0.8)' : 'rgba(0, 123, 255, 1)')};
  }
`;

const Spinner = styled.div`
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top: 3px solid white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  animation: spin 1s linear infinite;
  display: inline-block;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const GrantsTable = styled.table`
  width: 100%;
  margin-top: 20px;
  border-collapse: collapse;
  color: white;
  font-size: 14px;

  th, td {
    border: 1px solid rgba(255, 255, 255, 0.3);
    padding: 10px;
    text-align: left;
  }

  th {
    background-color: rgba(0, 123, 255, 0.5);
  }

  td {
    background-color: rgba(255, 255, 255, 0.1);
  }

  a {
    padding: 6px 12px;
    background-color: #007bff;
    color: white;
    border-radius: 4px;
    text-decoration: none;
    display: inline-block;
  }

  a:hover {
    background-color: #0056b3;
  }
`;

const Logo = styled.img`
    position: absolute;
    bottom: 20px;
    right: 20px;
    width: 150px;  // Increased from 60px
    height: auto;
    opacity: 0.9;
`;


const App = () => {
    const [searchMode, setSearchMode] = useState('keywords'); // 'keywords' or 'url'
    const [searchTerms, setSearchTerms] = useState('');
    const [searchURL, setSearchURL] = useState('');
    const [grants, setGrants] = useState([]);
    const [clicked, setClicked] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSearch = async () => {
        setClicked(true);
        setLoading(true);

        try {
            let response;

            if (searchMode === 'keywords') {
                const termsArray = searchTerms
                    .split('\n')
                    .map(term => term.trim())
                    .filter(term => term);

                response = await axios.post('https://rairo-qxgrants-api.hf.space/scrape', {
                    search_terms: termsArray
                });

            } else if (searchMode === 'url') {
                response = await axios.post('https://rairo-qxgrants-api.hf.space/scrape_url', {
                    url: searchURL.trim()
                });
            }

            const results = response?.data?.grants || [];
            setGrants(results);

            if (results.length > 0) {
                await addDoc(collection(db, 'grantQueries'), {
                    mode: searchMode,
                    query: searchMode === 'keywords' ? searchTerms : searchURL,
                    timestamp: Timestamp.now(),
                    results
                });
            }
        } catch (error) {
            console.error('Error fetching grants:', error);
            alert('Failed to fetch grant data.');
        } finally {
            setClicked(false);
            setLoading(false);
        }
    };
    return (
        <PageWrapper>
            <GlassContainer>
                <Title>Search for Grant Opportunities</Title>
                <select
                    value={searchMode}
                    onChange={(e) => setSearchMode(e.target.value)}
                    style={{
                        padding: '10px',
                        borderRadius: '8px',
                        marginBottom: '15px',
                        fontSize: '16px',
                        backgroundColor: '#f0f0f0',
                        border: 'none'
                    }}
                >
                    <option value="keywords">Search by Keywords</option>
                    <option value="url">Search by URL</option>
                </select>
                {searchMode === 'keywords' ? (
                    <UrlInput
                        placeholder="e.g., Renewable Energy Grants, Climate Change Research Grants"
                        value={searchTerms}
                        onChange={(e) => setSearchTerms(e.target.value)}
                    />
                ) : (
                    <UrlInput
                        placeholder="Paste a URL e.g. https://www.afdb.org/en/news-and-events/loans-grants"
                        value={searchURL}
                        onChange={(e) => setSearchURL(e.target.value)}
                    />
                )}
                <SearchButton clicked={clicked} loading={loading} onClick={handleSearch}>
                    {loading ? <Spinner /> : '🔍 Explore Grants'}
                </SearchButton>

                {grants.length > 0 ? (
                    <GrantsTable>
                        <thead>
                        <tr>
                            <th>Grant Name</th>
                            <th>Summary</th>
                            <th>Organization</th>
                            <th>Value</th>
                            <th>Deadline</th>
                            <th>Countries</th>
                            <th>Sector</th>
                            <th>Explore</th>
                        </tr>
                        </thead>
                        <tbody>
                        {grants.map((grant, index) => (
                            <tr key={index}>
                                <td>{grant['Grant name/title']}</td>
                                <td>{grant['Short summary'] || 'N/A'}</td>
                                <td>{grant['Funding organization']}</td>
                                <td>{grant['Grant value (numeric only)'] !== 'NA' ? `$${grant['Grant value (numeric only)'].toLocaleString()}` : 'N/A'}</td>
                                <td>{grant['Application deadline']}</td>
                                <td>{grant['Eligible countries']}</td>
                                <td>{grant['Sector/field']}</td>
                                <td>
                                    {grant['link URL'] ? (
                                        <a
                                            href={
                                                grant['link URL'].startsWith('http')
                                                    ? grant['link URL']
                                                    : `https://epa.gov${grant['link URL']}`
                                            }
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            Explore
                                        </a>
                                    ) : (
                                        'N/A'
                                    )}
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </GrantsTable>
                ) : !loading && (
                    <p style={{ marginTop: '20px', color: '#fff', fontSize: '16px' }}>
                        😕 No grants found for your search. Try different terms.
                    </p>
                )}
            </GlassContainer>

            <Logo src={QuantIcon} alt="Quantilytix Logo" />
        </PageWrapper>
    );
};

export default App;
